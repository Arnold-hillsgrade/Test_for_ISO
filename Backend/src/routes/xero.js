import express from 'express';
import dotenv from 'dotenv';
import Business from '../models/Business.js';
import { info, warn, error } from '../utils/logger.js';
import {
  validateItemBelongsToTenant,
  getJobReportingReferencedItems,
  getJobPlanningReferencedItems,
  getQuoteReferencedItems,
  getPurchaseOrderReferencedItems,
  setIntegrationMessage,
  putInternalMessage,
  setGeneratedField
} from '../services/isoplus.js';
import {
  configure,
  ensureAuthenticated,
  createInvoice,
  createOrUpdateContact,
  createQuote,
  quoteExists,
  createPurchaseOrder,
  purchaseOrderExists,
  getAuthUrl,
  exchangeCode,
  refreshTokenSet,
  callback,
  getContactByEmail,
  findOrCreateItem
} from '../services/xero.js';
import { Item } from '../dto/itemsPayload.js';
import { logAuditTrail } from '../utils/auditLogger.js';

dotenv.config();
const router = express.Router();

function mapInvoiceValuesToJobDTO(values) {
  return {
    jobNumber: values['Job Number'],
    jobDurationHrs: values['Job Duration (Hrs.)'],
    serviceFeeType: values['Service Fee Type'],
    payableServiceFee: values['Payable Service Fee($) - GST Excl.'],
    payableMaterialFee: values['Payable Material Fee($) - GST Excl.'],
    otherPayableFee: values['Other Payable Fee($) - GST Excl.'],
  };
}

router.get('/services', (req, res) => {
  const services = [
    { Name: 'Create invoice', Status: 'Ready' },
    { Name: 'Update invoice', Status: 'In progress' },
    { Name: 'Get invoice', Status: 'In progress' },
    { Name: 'Retrieving the online invoice URL', Status: 'In progress', Use: 'To get an online invoice URL.' },
    { Name: 'Emailing an invoice', Status: 'In progress', Use: 'To trigger the email of a sales invoice out of Xero.' },
    { Name: 'Webhooks', Status: 'In progress', Use: 'Create a subscription to get invoice events.' },
  ];
  res.json(services);
});

router.get('/hello', (req, res) => {
  res.send('Hello, World!');
});

router.post('/:workspaceId/:boardId/invoice', async (req, res) => {
  const { workspaceId, boardId } = req.params;
  const payload = req.body;
  if (!payload.items || payload.items.length === 0) {
    warn('Xero-Service', 'Received payload with empty items.', { payload }, req);
    return res.json('No items found in the payload.');
  }

  const item = payload.items[0];
  const mappedValues = mapInvoiceValuesToJobDTO(item.values);
  const { error: validationError } = Item.validate('Job', mappedValues);
  if (validationError) {
    await setIntegrationMessage(workspaceId, boardId, item.id, `ERROR: Invoice validation failed: ${JSON.stringify(validationError.details)}`);
    return res.status(400).json({ message: 'Invoice validation failed', details: validationError.details });
  }

  try {
    const business = await Business.findOne({ workspaceId });
    await configure();
    await ensureAuthenticated(business.xeroTokens.accessToken, business.xeroTokens.refreshToken, business.xeroTokens.expiresAt);
    const invoiceValues = item.values;

    await validateItemBelongsToTenant(workspaceId, boardId, item.id);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Running...");

    const [jobPlanningValues, serviceFeeTypeValues] = await getJobReportingReferencedItems(workspaceId, boardId, item.id);
    if (!jobPlanningValues) {
      putInternalMessage(workspaceId, boardId, item.id, "Job planning information is required. Job reporting is missing a job planning reference.");
      throw new Error("Job planning information is required. Job reporting is missing a job planning reference.");
    }
    if (!serviceFeeTypeValues) {
      putInternalMessage(workspaceId, boardId, item.id, "Service fee type information is required. Job reporting is missing a service fee type reference.");
      throw new Error("Service fee type information is required. Job reporting is missing a service fee type reference.");
    }

    const [contactValues, jobTypeValues] = await getJobPlanningReferencedItems(workspaceId, boardId, jobPlanningValues.id);
    if (!contactValues) {
      putInternalMessage(workspaceId, boardId, item.id, "Client information is required. Job planning is missing a client reference.");
      throw new Error("Client information is required. Job planning is missing a client reference.");
    }

    let contact = await getContactByEmail(contactValues.emailAddress);
    if (!contact) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "The contact does not exist in Xero, creating...");
      contact = await createOrUpdateContact({
        name: contactValues.client,
        phones: [{ phoneType: 'DEFAULT', phoneNumber: contactValues.phoneNumber }],
        firstName: contactValues.contactPersonsFirstName,
        lastName: contactValues.contactPersonsLastName,
        addresses: [
          {
            addressType: 'POBOX',
            addressLine1: contactValues.address,
            city: contactValues.suburb,
            region: contactValues.state,
            postalCode: contactValues.postcode.toString()
          },
          {
            addressType: 'STREET',
            addressLine1: contactValues.address,
            city: contactValues.suburb,
            region: contactValues.state,
            postalCode: contactValues.postcode.toString()
          }
        ],
        emailAddress: contactValues.emailAddress
      });
    } else {
      const xeroUpdatedDate = new Date(contact.updatedDateUTC);
      const isoplusUpdatedDate = new Date(contactValues.updatedAt);

      if (xeroUpdatedDate < isoplusUpdatedDate) {
        contact = await createOrUpdateContact({
          contactID: contact.contactID,
          name: contactValues.client,
          phones: [{ phoneType: 'DEFAULT', phoneNumber: contactValues.phoneNumber }],
          firstName: contactValues.contactPersonsFirstName,
          lastName: contactValues.contactPersonsLastName,
          addresses: [
            {
              addressType: 'POBOX',
              addressLine1: contactValues.address,
              city: contactValues.suburb,
              region: contactValues.state,
              postalCode: contactValues.postcode.toString()
            },
            {
              addressType: 'STREET',
              addressLine1: contactValues.address,
              city: contactValues.suburb,
              region: contactValues.state,
              postalCode: contactValues.postcode.toString()
            }
          ],
          emailAddress: contactValues.emailAddress
        });
      }
    }

    if (!jobTypeValues) {
      putInternalMessage(workspaceId, boardId, item.id, "Job type information is required. Job planning is missing a job type reference.");
      throw new Error("Job type information is required. Job planning is missing a job type reference.");
    }

    const jobType = await findOrCreateItem(jobTypeValues.jobCode, jobTypeValues.jobType);
    let gst = invoiceValues["GST"] == "10%" ? "10%" : "0%";
    const invoice = {
      type: 'ACCREC',
      contact: { contactID: contact.contactID },
      reference: jobPlanningValues.jobNumber,
      lineItems: [],
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      status: "DRAFT"
    };

    const serviceFeeType = serviceFeeTypeValues.feeType;
    invoice.lineItems.push({
      itemCode: jobType.code,
      description: `${jobPlanningValues.jobTitle} - ${serviceFeeType} - ${invoiceValues['Job Duration (Hrs.)']} Hrs.`,
      quantity: 1,
      unitAmount: invoiceValues['Payable Service Fee($) - GST Excl.'],
      taxType: gst == "10%"? "OUTPUT" : "EXEMPTOUTPUT",
    });

    if (invoiceValues['Payable Material Fee($) - GST Excl.'] > 0) {
      invoice.lineItems.push({
        description: "Used Material/Part",
        quantity: 1,
        unitAmount: invoiceValues['Payable Material Fee($) - GST Excl.'],
        taxType: gst == "10%"? "OUTPUT" : "EXEMPTOUTPUT",
      });
    }

    if (invoiceValues['Other Payable Fee($) - GST Excl.'] > 0) {
      invoice.lineItems.push({
        description: "Other Payable Fee",
        quantity: 1,
        unitAmount: invoiceValues['Other Payable Fee($) - GST Excl.'],
        taxType: gst == "10%"? "OUTPUT" : "EXEMPTOUTPUT",
      });
    }

    const createdInvoice = await createInvoice(invoice);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Your invoice has been created successfully in Xero.");

    logAuditTrail({
      workspaceId,
      action: "Create Xero Invoice",
      detail: `Invoice created successfully, invoice number: ${createdInvoice.invoiceNumber}`,
      req
    });

    await setGeneratedField(workspaceId, boardId, item.id, `${createdInvoice.invoiceNumber} (Xero)`);

    res.json(createdInvoice);
  } catch (err) {
    error('Xero-Service', 'Error creating invoice', err);
    if (payload.items[0]) {
      await setIntegrationMessage(workspaceId, boardId, payload.items[0].id, "An error occurred whilst creating the invoice. Please contact ISO+™ support. Further information: " + err.message);
    }
    logAuditTrail({
      workspaceId,
      action: "Create Xero Invoice",
      detail: `Error creating invoice: ${err.message}`,
      req
    });
    res.status(200).json({ message: 'Error creating invoice', error: err.message });
  }
});

router.post('/:workspaceId/:boardId/contact', async (req, res) => {
  const { workspaceId, boardId } = req.params;
  const payload = req.body;
  if (!payload.items || payload.items.length === 0) {
    warn('Xero-Service', 'Received payload with empty items.', { payload }, req);
    return res.json('No items found in the payload.');
  }

  const item = payload.items[0];
  const contactValues = item.values;
  const mappedContact = {
    client: contactValues['Client'],
    typeOfClient: contactValues['Type Of Client'],
    contactPersonsFirstName: contactValues["Contact Person's First Name"],
    contactPersonsLastName: contactValues["Contact Person's Last Name"],
    emailAddress: contactValues['Email Address'],
    phoneNumber: contactValues['Phone Number'],
    paymentTerm: contactValues['Payment Term'],
    additionalNotes: contactValues['Additional Notes'],
    address: contactValues['Address'],
    suburb: contactValues['Suburb'],
    state: contactValues['State'],
    postcode: contactValues['Postcode'],
    xeroQuote: contactValues['Xero Quote'],
    xeroAccount: contactValues['Xero Account'],
    jobTitle: contactValues['Job Title'],
    issueDate: contactValues['Issue Date'],
    integrationValidation: contactValues['Integration Validation'],
    integrationMessage: contactValues['Integration Message'],
  };
  const { error: validationError } = Item.validate('Contact', mappedContact);
  if (validationError) {
    await setIntegrationMessage(workspaceId, boardId, item.id, `ERROR: Contact validation failed: ${JSON.stringify(validationError.details)}`);
    return res.status(400).json({ message: 'Contact validation failed', details: validationError.details });
  }

  try {
    const business = await Business.findOne({ workspaceId });
    await configure();
    await ensureAuthenticated(business.xeroTokens.accessToken, business.xeroTokens.refreshToken, business.xeroTokens.expiresAt);

    await validateItemBelongsToTenant(workspaceId, boardId, item.id);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Running...");

    const existingContact = await getContactByEmail(contactValues['Email Address']);
    let contact;

    if (existingContact) {
      existingContact.name = contactValues.Client;
      existingContact.phones = [{ phoneType: 'DEFAULT', phoneNumber: contactValues['Phone Number'] }];
      existingContact.firstName = contactValues["Contact Person's First Name"];
      existingContact.lastName = contactValues["Contact Person's Last Name"];
      existingContact.addresses = [
        {
          addressType: 'POBOX',
          addressLine1: contactValues.Address,
          city: contactValues.Suburb,
          region: contactValues.State,
          postalCode: contactValues.Postcode.toString()
        },
        {
          addressType: 'STREET',
          addressLine1: contactValues.Address,
          city: contactValues.Suburb,
          region: contactValues.State,
          postalCode: contactValues.Postcode.toString()
        }
      ];
      existingContact.emailAddress = contactValues['Email Address'];

      contact = await createOrUpdateContact(existingContact);
      await setIntegrationMessage(workspaceId, boardId, item.id, "Your contact has been updated successfully in Xero.");
    } else {
      contact = await createOrUpdateContact({
        name: contactValues.Client,
        phones: [{ phoneType: 'DEFAULT', phoneNumber: contactValues['Phone Number'] }],
        firstName: contactValues["Contact Person's First Name"],
        lastName: contactValues["Contact Person's Last Name"],
        addresses: [
          {
            addressType: 'POBOX',
            addressLine1: contactValues.Address,
            city: contactValues.Suburb,
            region: contactValues.State,
            postalCode: contactValues.Postcode.toString()
          },
          {
            addressType: 'STREET',
            addressLine1: contactValues.Address,
            city: contactValues.Suburb,
            region: contactValues.State,
            postalCode: contactValues.Postcode.toString()
          }
        ],
        emailAddress: contactValues['Email Address']
      });

      await setIntegrationMessage(workspaceId, boardId, item.id, "Your contact has been created successfully in Xero.");
    }

    res.json(contact);
  } catch (err) {
    error('Xero-Service', 'Error creating/updating contact', err);
    if (item) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "An error occurred whilst creating or updating the contact. Please contact ISO+™ support. Further information: " + err.message);
    }
    res.status(200).json({ message: 'Error creating/updating contact', error: err.message });
  }
});

router.post('/:workspaceId/:boardId/contractor', async (req, res) => {
  const { workspaceId, boardId } = req.params;
  const payload = req.body;
  if (!payload.items || payload.items.length === 0) {
    warn('Xero-Service', 'Received payload with empty items.', { payload }, req);
    return res.json('No items found in the payload.');
  }

  const item = payload.items[0];
  const contractorValues = item.values;
  const mappedContractor = {
    Contractor: contractorValues['Contractor'],
    TypeOfContractor: contractorValues['Type Of Contractor'],
    ContactPersonsFirstName: contractorValues["Contact Person's First Name"],
    ContactPersonsLastName: contractorValues["Contact Person's Last Name"],
    EmailAddress: contractorValues['Email Address'],
    PhoneNumber: contractorValues['Phone Number'],
    PaymentTerm: contractorValues['Payment Term'],
    AdditionalNotes: contractorValues['Additional Notes'],
    Address: contractorValues['Address'],
    Suburb: contractorValues['Suburb'],
    State: contractorValues['State'],
    Postcode: contractorValues['Postcode'],
    IntegrationValidation: contractorValues['Integration Validation'],
    IntegrationMessage: contractorValues['Integration Message'],
  };
  const { error: validationError } = Item.validate('Contractor', mappedContractor);
  if (validationError) {
    await setIntegrationMessage(workspaceId, boardId, item.id, `ERROR: Contractor validation failed: ${JSON.stringify(validationError.details)}`);
    return res.status(400).json({ message: 'Contractor validation failed', details: validationError.details });
  }

  try {
    const business = await Business.findOne({ workspaceId });
    await configure();
    await ensureAuthenticated(business.xeroTokens.accessToken, business.xeroTokens.refreshToken, business.xeroTokens.expiresAt);

    await validateItemBelongsToTenant(workspaceId, boardId, item.id);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Running...");

    const existingContact = await getContactByEmail(contractorValues['Email Address']);
    let contact;

    if (existingContact) {
      existingContact.name = contractorValues.Contractor;
      existingContact.phones = [{ phoneType: 'DEFAULT', phoneNumber: contractorValues['Phone Number'] }];
      existingContact.firstName = contractorValues["Contact Person's First Name"];
      existingContact.lastName = contractorValues["Contact Person's Last Name"];
      existingContact.addresses = [
        {
          addressType: 'POBOX',
          addressLine1: contractorValues.Address,
          city: contractorValues.Suburb,
          region: contractorValues.State,
          postalCode: contractorValues.Postcode.toString()
        },
        {
          addressType: 'STREET',
          addressLine1: contractorValues.Address,
          city: contractorValues.Suburb,
          region: contractorValues.State,
          postalCode: contractorValues.Postcode.toString()
        }
      ];
      existingContact.emailAddress = contractorValues['Email Address'];

      contact = await createOrUpdateContact(existingContact);
      await setIntegrationMessage(workspaceId, boardId, item.id, "Your contractor has been updated successfully in Xero.");
    } else {
      contact = await createOrUpdateContact({
        name: contractorValues.Contractor,
        phones: [{ phoneType: 'DEFAULT', phoneNumber: contractorValues['Phone Number'] }],
        firstName: contractorValues["Contact Person's First Name"],
        lastName: contractorValues["Contact Person's Last Name"],
        addresses: [
          {
            addressType: 'POBOX',
            addressLine1: contractorValues.Address,
            city: contractorValues.Suburb,
            region: contractorValues.State,
            postalCode: contractorValues.Postcode.toString()
          },
          {
            addressType: 'STREET',
            addressLine1: contractorValues.Address,
            city: contractorValues.Suburb,
            region: contractorValues.State,
            postalCode: contractorValues.Postcode.toString()
          }
        ],
        emailAddress: contractorValues['Email Address']
      });
      await setIntegrationMessage(workspaceId, boardId, item.id, "Your contractor has been created successfully in Xero.");
    }

    res.json(contact);
  } catch (err) {
    error('Xero-Service', 'Error creating/updating contractor', err);
    if (item) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "An error occurred whilst creating or updating the contractor. Please contact ISO+™ support. Further information: " + err.message);
    }
    res.status(200).json({ message: 'Error creating/updating contractor', error: err.message });
  }
});

router.post('/:workspaceId/:boardId/quote', async (req, res) => {
  const { workspaceId, boardId } = req.params;
  const payload = req.body;
  if (!payload.items || payload.items.length === 0) {
    warn('Xero-Service', 'Received payload with empty items.', { payload }, req);
    return res.json('No items found in the payload.');
  }

  const item = payload.items[0];

  try {
    const business = await Business.findOne({ workspaceId });
    await configure();
    await ensureAuthenticated(business.xeroTokens.accessToken, business.xeroTokens.refreshToken, business.xeroTokens.expiresAt);
    const quoteValues = item.values;

    await validateItemBelongsToTenant(workspaceId, boardId, item.id);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Running...");

    const [contactValues, jobTypeValues] = await getQuoteReferencedItems(workspaceId, boardId, item.id);
    if (!contactValues) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "ERROR: Client information is required.");
      throw new Error("Client information is required.");
    }
    if (!jobTypeValues) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "ERROR: Job type information is required.");
      throw new Error("Job type information is required.");
    }

    let contact = await getContactByEmail(contactValues.emailAddress);
    if (!contact) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "The contact does not exist in Xero, creating...");
      contact = await createOrUpdateContact({
        name: contactValues.client,
        phones: [{ phoneType: 'DEFAULT', phoneNumber: contactValues.phoneNumber }],
        firstName: contactValues.contactPersonsFirstName,
        lastName: contactValues.contactPersonsLastName,
        addresses: [
          {
            addressType: 'POBOX',
            addressLine1: contactValues.address,
            city: contactValues.suburb,
            region: contactValues.state,
            postalCode: contactValues.postcode.toString()
          },
          {
            addressType: 'STREET',
            addressLine1: contactValues.address,
            city: contactValues.suburb,
            region: contactValues.state,
            postalCode: contactValues.postcode.toString()
          }
        ],
        emailAddress: contactValues.emailAddress
      });
    } else {
      const xeroUpdatedDate = new Date(contact.updatedDateUTC);
      const isoplusUpdatedDate = new Date(contactValues.updatedAt);

      if (xeroUpdatedDate < isoplusUpdatedDate) {
        contact = await createOrUpdateContact({
          contactID: contact.contactID,
          name: contactValues.client,
          phones: [{ phoneType: 'DEFAULT', phoneNumber: contactValues.phoneNumber }],
          firstName: contactValues.contactPersonsFirstName,
          lastName: contactValues.contactPersonsLastName,
          addresses: [
            {
              addressType: 'POBOX',
              addressLine1: contactValues.address,
              city: contactValues.suburb,
              region: contactValues.state,
              postalCode: contactValues.postcode.toString()
            },
            {
              addressType: 'STREET',
              addressLine1: contactValues.address,
              city: contactValues.suburb,
              region: contactValues.state,
              postalCode: contactValues.postcode.toString()
            }
          ],
          emailAddress: contactValues.emailAddress
        });
      }
    }

    const jobType = await findOrCreateItem(jobTypeValues.jobCode, jobTypeValues.jobType);
    let rawChecklist = quoteValues['Quote Checklist'];
    let quoteChecklist = [];
    if (Array.isArray(rawChecklist)) {
      quoteChecklist = rawChecklist.map(String);
    } else if (typeof rawChecklist === 'string' && rawChecklist.trim() !== '') {
      quoteChecklist = [rawChecklist];
    }
    const mappedQuote = {
      issueDate: quoteValues['Issue Date'],
      expiryDate: quoteValues['Expiry Date'],
      jobTitle: quoteValues['Job Title'],
      unitPrice: quoteValues['Unit Price($) - GST Excl.'],
      quantity: quoteValues.Quantity,
      jobDescription: quoteValues['Job Description'] ? quoteValues['Job Description'].toString().replace(/<[^>]*>/g, '') : '',
      quoteChecklist,
    };
    const xeroQuote = {
      contact: { contactID: contact.contactID },
      date: quoteValues['Issue Date'],
      expiryDate: quoteValues['Expiry Date'],
      title: quoteValues['Job Title'],
      summary: quoteValues['Job Description'].toString().replace(/<[^>]*>/g, ''),
      lineItems: [
        {
          itemCode: jobType.code,
          description: `${quoteValues['Job Title']} - ${quoteValues['Job Description'].toString().replace(/<[^>]*>/g, '')}`,
          quantity: quoteValues.Quantity,
          unitAmount: quoteValues['Unit Price($) - GST Excl.'],
          taxType: quoteValues['GST'] == "10%"? "OUTPUT" : "EXEMPTOUTPUT",
        }
      ]
    };

    const { error: validationError } = Item.validate('Quote', mappedQuote);
    if (validationError) {
      await setIntegrationMessage(workspaceId, boardId, item.id, `ERROR: Quote validation failed: ${JSON.stringify(validationError.details)}`);
      return res.status(400).json({ message: 'Quote validation failed', details: validationError.details });
    }

    const createdQuote = await createQuote(xeroQuote);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Your quote has been created successfully in Xero.");

    logAuditTrail({
      workspaceId,
      action: "Create Xero Quote",
      detail: `Quote created successfully, quote number: ${createdQuote.quoteNumber}`,
      req
    });

    await setGeneratedField(workspaceId, boardId, item.id, `${createdQuote.quoteNumber} (Xero)`);

    res.json(createdQuote);
  } catch (err) {
    error('Xero-Service', 'Error creating quote', err);
    if (item) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "An error occurred whilst creating the quote. Please contact ISO+™ support. Further information: " + err.message);
    }
    logAuditTrail({
      workspaceId,
      action: "Create Xero Quote",
      detail: `Error creating quote: ${err.message}`,
      req
    });
    res.status(200).json({ message: 'Error creating quote', error: err.message });
  }
});

router.post('/:workspaceId/:boardId/purchaseorder', async (req, res) => {
  const { workspaceId, boardId } = req.params;
  const payload = req.body;
  if (!payload.items || payload.items.length === 0) {
    warn('Xero-Service', 'Received payload with empty items.', { payload }, req);
    return res.json('No items found in the payload.');
  }

  const item = payload.items[0];

  try {
    const business = await Business.findOne({ workspaceId });
    await configure();
    await ensureAuthenticated(business.xeroTokens.accessToken, business.xeroTokens.refreshToken, business.xeroTokens.expiresAt);

    const purchaseOrderValues = item.values;

    await validateItemBelongsToTenant(workspaceId, boardId, item.id);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Running...");

    const [contractorValues, jobTypeValues] = await getPurchaseOrderReferencedItems(workspaceId, boardId, item.id);
    if (!contractorValues) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "ERROR: Contractor information is required. Purchase order is missing Contractor.");
      throw new Error("Contractor information is required. Purchase order is missing Contractor.");
    }
    if (!jobTypeValues) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "ERROR: Job type information is required. Purchase order is missing Job Type.");
      throw new Error("Job type information is required. Purchase order is missing Job Type.");
    }

    let contact = await getContactByEmail(contractorValues.emailAddress);
    if (!contact) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "The contact does not exist in Xero, creating...");
      contact = await createOrUpdateContact({
        name: contractorValues.contractor,
        phones: [{ phoneType: 'DEFAULT', phoneNumber: contractorValues.phoneNumber }],
        firstName: contractorValues.contactPersonsFirstName,
        lastName: contractorValues.contactPersonsLastName,
        addresses: [
          {
            addressType: 'POBOX',
            addressLine1: contractorValues.address,
            city: contractorValues.suburb,
            region: contractorValues.state,
            postalCode: contractorValues.postcode.toString()
          },
          {
            addressType: 'STREET',
            addressLine1: contractorValues.address,
            city: contractorValues.suburb,
            region: contractorValues.state,
            postalCode: contractorValues.postcode.toString()
          }
        ],
        emailAddress: contractorValues.emailAddress
      });
    } else {
      const xeroUpdatedDate = new Date(contact.updatedDateUTC);
      const isoplusUpdatedDate = new Date(contractorValues.updatedAt);

      if (xeroUpdatedDate < isoplusUpdatedDate) {
        contact = await createOrUpdateContact({
          contactID: contact.contactID,
          name: contractorValues.contractor,
          phones: [{ phoneType: 'DEFAULT', phoneNumber: contractorValues.phoneNumber }],
          firstName: contractorValues.contactPersonsFirstName,
          lastName: contractorValues.contactPersonsLastName,
          addresses: [
            {
              addressType: 'POBOX',
              addressLine1: contractorValues.address,
              city: contractorValues.suburb,
              region: contractorValues.state,
              postalCode: contractorValues.postcode.toString()
            },
            {
              addressType: 'STREET',
              addressLine1: contractorValues.address,
              city: contractorValues.suburb,
              region: contractorValues.state,
              postalCode: contractorValues.postcode.toString()
            }
          ],
          emailAddress: contractorValues.emailAddress
        });
      }
    }

    const jobType = await findOrCreateItem(jobTypeValues.jobCode, jobTypeValues.jobType);

    const mappedPO = {
      clientsOrderNumber: purchaseOrderValues["Client's Order Number"],
      issueDate: purchaseOrderValues['Issue Date'],
      deliveryDate: purchaseOrderValues['Delivery Date'],
      jobTitle: purchaseOrderValues['Job Title'],
      unitPrice: purchaseOrderValues['Unit Price($) - GST Excl.'],
      quantity: purchaseOrderValues.Quantity,
      jobDescription: purchaseOrderValues['Job Description'],
    };
    const purchaseOrder = {
      contact: { contactID: contact.contactID },
      date: purchaseOrderValues['Issue Date'],
      deliveryDate: purchaseOrderValues['Delivery Date'],
      attentionTo: `${contractorValues.contactPersonsFirstName} ${contractorValues.contactPersonsLastName}`,
      deliveryAddress: `${contractorValues.address} ${contractorValues.suburb} ${contractorValues.state} ${contractorValues.postcode}`,
      telephone: contractorValues.phoneNumber,
      deliveryInstructions: `${purchaseOrderValues['Additional Notes'] ? purchaseOrderValues['Additional Notes'].replace(/<[^>]*>/g, '') : ''}`,
      lineItems: [
        {
          itemCode: jobType.code,
          description: `${purchaseOrderValues['Job Title']}${purchaseOrderValues['Job Description'] ? ` - ${purchaseOrderValues['Job Description'].replace(/<[^>]*>/g, '')}` : ''}`,
          quantity: purchaseOrderValues.Quantity,
          unitAmount: purchaseOrderValues['Unit Price($) - GST Excl.'],
          taxType: purchaseOrderValues['GST'] == "10%" ? "INPUT" : "EXEMPTEXPENSES",
        }
      ]
    };

    const { error: validationError } = Item.validate('PurchaseOrder', mappedPO);
    if (validationError) {
      await setIntegrationMessage(workspaceId, boardId, item.id, `ERROR: Purchase order validation failed: ${JSON.stringify(validationError.details)}`);
      return res.status(400).json({ message: 'Purchase order validation failed', details: validationError.details });
    }

    const createdPurchaseOrder = await createPurchaseOrder(purchaseOrder);
    await setIntegrationMessage(workspaceId, boardId, item.id, "Your purchase order has been created successfully in Xero.");

    logAuditTrail({
      workspaceId,
      action: "Create Xero Purchase Order",
      detail: `Purchase order created successfully, PO number: ${createdPurchaseOrder.purchaseOrderNumber}`,
      req
    });
    await setGeneratedField(workspaceId, boardId, item.id, `${createdPurchaseOrder.purchaseOrderNumber} (Xero)`);
    res.json(createdPurchaseOrder);
  } catch (err) {
    error('Xero-Service', 'Error creating purchase order', err);
    if (item) {
      await setIntegrationMessage(workspaceId, boardId, item.id, "An error occurred whilst creating the purchase order. Please contact ISO+™ support. Further information: " + err.message);
    }
    logAuditTrail({
      workspaceId,
      action: "Create Xero Purchase Order",
      detail: `Error creating purchase order: ${err.message}`,
      req
    });
    res.status(200).json({ message: 'Error creating purchase order', error: err.message });
  }
});

router.get("/redirect", async (req, res) => {
  try {
    await configure();
    const url = await getAuthUrl();
    res.json({ url });
  } catch (err) {
    error('Xero-Service', 'Error generating redirect URL', err);
    res.status(200).json({ message: 'Error generating redirect URL', error: err.message });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const result = await callback(code, req.url);
    res.send(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage(${JSON.stringify({ ...result, type: 'XERO_AUTH' })}, '*');
                        window.close();
                    </script>
                </body>
            </html>
        `);
  } catch (err) {
    error('Xero-Service', 'Error in Xero callback', err);
    res.status(200).send(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage(${JSON.stringify({ success: false, message: 'Authentication failed', type: 'XERO_AUTH' })}, '*');
                        window.close();
                    </script>
                </body>
            </html>
        `);
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { tokenSet } = req.body;
    await configure();
    const newTokenSet = await refreshTokenSet(tokenSet);
    res.json({ tokenSet: newTokenSet });
  } catch (err) {
    error('Xero-Service', 'Error refreshing token', err);
    res.status(200).json({ message: 'Error refreshing token', error: err.message });
  }
});

export default router;