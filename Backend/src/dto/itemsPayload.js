import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

class ItemValues {
    // Base class for all item values
}

class ContactValues extends ItemValues {
    constructor(data) {
        super();
        this.client = data.client;
        this.typeOfClient = data.typeOfClient;
        this.contactPersonsFirstName = data.contactPersonsFirstName;
        this.contactPersonsLastName = data.contactPersonsLastName;
        this.emailAddress = data.emailAddress;
        this.phoneNumber = data.phoneNumber;
        this.paymentTerm = data.paymentTerm;
        this.additionalNotes = data.additionalNotes;
        this.address = data.address;
        this.suburb = data.suburb;
        this.state = data.state;
        this.postcode = data.postcode;
        this.xeroQuote = data.xeroQuote;
        this.xeroAccount = data.xeroAccount;
        this.jobTitle = data.jobTitle;
        this.issueDate = data.issueDate;
        this.integrationValidation = data.integrationValidation;
        this.integrationMessage = data.integrationMessage;
    }

    static validationSchema() {
        return Joi.object({
            client: Joi.string().required().messages({
                'string.empty': 'Client is required.',
                'any.required': 'Client is required.'
            }),
            typeOfClient: Joi.string().allow(null, ''),
            contactPersonsFirstName: Joi.string().allow(null, ''),
            contactPersonsLastName: Joi.string().allow(null, ''),
            emailAddress: Joi.string().email().required().messages({
                'string.empty': 'Email Address is required.',
                'string.email': 'Email Address is invalid.',
                'any.required': 'Email Address is required.'
            }),
            phoneNumber: Joi.string().required().messages({
                'string.empty': 'Phone Number is required.',
                'any.required': 'Phone Number is required.'
            }),
            paymentTerm: Joi.string().allow(null, ''),
            additionalNotes: Joi.string().allow(null, ''),
            address: Joi.string().allow(null, ''),
            suburb: Joi.string().allow(null, ''),
            state: Joi.string().allow(null, ''),
            postcode: Joi.number().integer().allow(null),
            xeroQuote: Joi.string().allow(null, ''),
            xeroAccount: Joi.string().allow(null, ''),
            jobTitle: Joi.string().allow(null, ''),
            issueDate: Joi.date().allow(null),
            integrationValidation: Joi.string().allow(null, ''),
            integrationMessage: Joi.string().allow(null, '')
        });
    }
}

class ContractorValues extends ItemValues {
    constructor(data) {
        super();
        this.Contractor = data.Contractor;
        this.TypeOfContractor = data.TypeOfContractor;
        this.ContactPersonsFirstName = data.ContactPersonsFirstName;
        this.ContactPersonsLastName = data.ContactPersonsLastName;
        this.EmailAddress = data.EmailAddress;
        this.PhoneNumber = data.PhoneNumber;
        this.PaymentTerm = data.PaymentTerm;
        this.AdditionalNotes = data.AdditionalNotes;
        this.Address = data.Address;
        this.Suburb = data.Suburb;
        this.State = data.State;
        this.Postcode = data.Postcode;
        this.IntegrationValidation = data.IntegrationValidation;
        this.IntegrationMessage = data.IntegrationMessage;
    }

    static validationSchema() {
        return Joi.object({
            Contractor: Joi.string().required().messages({
                'string.empty': 'Contractor is required.',
                'any.required': 'Contractor is required.'
            }),
            TypeOfContractor: Joi.string().allow(null, ''),
            ContactPersonsFirstName: Joi.string().allow(null, ''),
            ContactPersonsLastName: Joi.string().allow(null, ''),
            EmailAddress: Joi.string().email().required().messages({
                'string.empty': 'Email Address is required.',
                'string.email': 'Email Address is invalid.',
                'any.required': 'Email Address is required.'
            }),
            PhoneNumber: Joi.string().required().messages({
                'string.empty': 'Phone Number is required.',
                'any.required': 'Phone Number is required.'
            }),
            PaymentTerm: Joi.string().allow(null, ''),
            AdditionalNotes: Joi.string().allow(null, ''),
            Address: Joi.string().allow(null, ''),
            Suburb: Joi.string().allow(null, ''),
            State: Joi.string().allow(null, ''),
            Postcode: Joi.number().integer().allow(null),
            IntegrationValidation: Joi.string().allow(null, ''),
            IntegrationMessage: Joi.string().allow(null, '')
        });
    }
}

class PurchaseOrderValues extends ItemValues {
    constructor(data) {
        super();
        this.id = data.id || uuidv4();
        this.clientsOrderNumber = data.clientsOrderNumber;
        this.issueDate = data.issueDate;
        this.deliveryDate = data.deliveryDate;
        this.jobTitle = data.jobTitle;
        this.unitPrice = data.unitPrice;
        this.quantity = data.quantity;
        this.jobDescription = data.jobDescription;
    }

    static validationSchema() {
        return Joi.object({
            id: Joi.string().guid().optional(),
            clientsOrderNumber: Joi.string().required(),
            issueDate: Joi.date().required().messages({
                'date.base': 'Issue Date is required.',
                'any.required': 'Issue Date is required.'
            }),
            deliveryDate: Joi.date().required().messages({
                'date.base': 'Delivery Date is required.',
                'any.required': 'Delivery Date is required.'
            }),
            jobTitle: Joi.string().required().messages({
                'string.empty': 'Job Title is required.',
                'any.required': 'Job Title is required.'
            }),
            unitPrice: Joi.number().required().messages({
                'number.base': 'Unit Price is required.',
                'any.required': 'Unit Price is required.'
            }),
            quantity: Joi.number().required().messages({
                'number.base': 'Quantity is required.',
                'any.required': 'Quantity is required.'
            }),
            jobDescription: Joi.string().required().messages({
                'string.empty': 'Job Description is required.',
                'any.required': 'Job Description is required.'
            })
        });
    }
}

class JobValues extends ItemValues {
    constructor(data) {
        super();
        this.id = data.id || uuidv4();
        this.jobNumber = data.jobNumber;
        this.jobDurationHrs = data.jobDurationHrs;
        this.serviceFeeType = data.serviceFeeType;
        this.payableServiceFee = data.payableServiceFee;
        this.payableMaterialFee = data.payableMaterialFee;
        this.otherPayableFee = data.otherPayableFee;
    }

    static validationSchema() {
        return Joi.object({
            id: Joi.string().guid().optional(),
            jobNumber: Joi.array().items(Joi.string()).required(),
            jobDurationHrs: Joi.number().required(),
            serviceFeeType: Joi.array().items(Joi.string()).required(),
            payableServiceFee: Joi.number().required(),
            payableMaterialFee: Joi.number().required(),
            otherPayableFee: Joi.number().required()
        });
    }
}

class JobTypeValues extends ItemValues {
    constructor(data) {
        super();
        this.id = data.id || uuidv4();
        this.jobType = data.jobType;
        this.jobCode = data.jobCode;
    }

    static validationSchema() {
        return Joi.object({
            id: Joi.string().guid().optional(),
            jobType: Joi.string().required(),
            jobCode: Joi.string().required()
        });
    }
}

class JobPlanningValues extends ItemValues {
    constructor(data) {
        super();
        this.id = data.id || uuidv4();
        this.clientOrderNumber = data.clientOrderNumber;
        this.jobTitle = data.jobTitle;
        this.jobNumber = data.jobNumber;
    }

    static validationSchema() {
        return Joi.object({
            id: Joi.string().guid().optional(),
            clientOrderNumber: Joi.string().required(),
            jobTitle: Joi.string().required(),
            jobNumber: Joi.string().required()
        });
    }
}

class ServiceFeeTypeValues extends ItemValues {
    constructor(data) {
        super();
        this.feeType = data.feeType;
        this.rate = data.rate;
    }

    static validationSchema() {
        return Joi.object({
            feeType: Joi.string().required(),
            rate: Joi.number().required()
        });
    }
}

class QuoteValues extends ItemValues {
    constructor(data) {
        super();
        this.id = data.id || uuidv4();
        this.issueDate = data.issueDate;
        this.expiryDate = data.expiryDate;
        this.jobTitle = data.title;
        this.unitPrice = data.unitPrice;
        this.quantity = data.quantity;
        this.jobDescription = data.summary;
        this.quoteChecklist = data.lineItems;
    }

    static validationSchema() {
        return Joi.object({
            id: Joi.string().guid().optional(),
            issueDate: Joi.date().required().messages({
                'date.base': 'Issue Date is required.',
                'any.required': 'Issue Date is required.'
            }),
            expiryDate: Joi.date().required().messages({
                'date.base': 'Expiry Date is required.',
                'any.required': 'Expiry Date is required.'
            }),
            jobTitle: Joi.string().required().messages({
                'string.empty': 'Job Title is required.',
                'any.required': 'Job Title is required.'
            }),
            unitPrice: Joi.number().required().messages({
                'number.base': 'Unit Price is required.',
                'any.required': 'Unit Price is required.'
            }),
            quantity: Joi.number().required().messages({
                'number.base': 'Quantity is required.',
                'any.required': 'Quantity is required.'
            }),
            jobDescription: Joi.string().required().messages({
                'string.empty': 'Job Description is required.',
                'any.required': 'Job Description is required.'
            }),
            quoteChecklist: Joi.array().items(Joi.string()).required().messages({
                'array.base': 'Quote Checklist is required.',
                'any.required': 'Quote Checklist is required.'
            })
        });
    }
}

class IsoPlusLineItemValues extends ItemValues {
    constructor(data) {
        super();
        this.description = data.description;
        this.quantity = data.quantity;
        this.unitAmount = data.unitAmount;
        this.accountCode = data.accountCode;
        this.discountRate = data.discountRate;
        this.itemCode = data.itemCode;
        this.taxType = data.taxType;
        this.taxAmount = data.taxAmount;
        this.lineAmount = data.lineAmount;
    }

    static validationSchema() {
        return Joi.object({
            description: Joi.string().required().messages({
                'string.empty': 'Description is required.',
                'any.required': 'Description is required.'
            }),
            quantity: Joi.number().required().messages({
                'number.base': 'Quantity must be a number.',
                'any.required': 'Quantity is required.'
            }),
            unitAmount: Joi.number().greater(0).required().messages({
                'number.base': 'UnitAmount must be a number.',
                'number.greater': 'UnitAmount must be greater than 0',
                'any.required': 'UnitAmount is required.'
            }),
            accountCode: Joi.string().allow(null, ''),
            discountRate: Joi.number().min(0).max(100).allow(null).messages({
                'number.base': 'DiscountRate must be a number.',
                'number.min': 'DiscountRate must be between 0 and 100',
                'number.max': 'DiscountRate must be between 0 and 100',
                'any.required': 'DiscountRate is required.'
            }),
            itemCode: Joi.string().allow(null, ''),
            taxType: Joi.string().allow(null, ''),
            taxAmount: Joi.number().min(0).allow(null).messages({
                'number.base': 'TaxAmount must be a number.',
                'number.min': 'TaxAmount must be non-negative.'
            }),
            lineAmount: Joi.number().min(0).allow(null).messages({
                'number.base': 'LineAmount must be a number.',
                'number.min': 'LineAmount must be non-negative.'
            })
        });
    }
}

class IsoPlusInvoiceValues extends ItemValues {
    constructor(data) {
        super();
        this.type = data.type;
        this.contactID = data.contactID;
        this.lineItems = (data.lineItems || []).map(item => new IsoPlusLineItemValues(item));
        this.currencyCode = data.currencyCode;
        this.lineAmountTypes = data.lineAmountTypes;
        this.date = data.date;
        this.dueDate = data.dueDate;
        this.status = data.status;
        this.reference = data.reference;
        this.customerName = data.customerName;
        this.amount = data.amount;
    }

    static validationSchema() {
        return Joi.object({
            type: Joi.string().valid('ACCPAY', 'ACCREC').required().messages({
                'any.only': 'Type must be either ACCPAY or ACCREC',
                'any.required': 'Type is required.'
            }),
            contactID: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
                'string.guid': 'ContactID must be a valid GUID.',
                'any.required': 'ContactID is required.'
            }),
            lineItems: Joi.array().items(IsoPlusLineItemValues.validationSchema()).min(1).required().messages({
                'array.base': 'LineItems must be an array.',
                'array.min': 'At least one LineItem is required',
                'any.required': 'LineItems is required.'
            }),
            currencyCode: Joi.string().allow(null, ''),
            lineAmountTypes: Joi.string().valid('Exclusive', 'Inclusive', 'NoTax').allow(null, '').messages({
                'any.only': 'LineAmountTypes must be Exclusive, Inclusive, or NoTax'
            }),
            date: Joi.date().allow(null, ''),
            dueDate: Joi.date().allow(null, ''),
            status: Joi.string().valid('AUTHORISED', 'DRAFT').allow(null, '').messages({
                'any.only': 'Status must be either AUTHORISED or DRAFT'
            }),
            reference: Joi.string().allow(null, ''),
            customerName: Joi.string().allow(null, ''),
            amount: Joi.number().allow(null, '')
        });
    }
}

class Item {
    constructor(type, values) {
        this.id = uuidv4();
        this.object = type;
        this.values = values;
        this.createdAt = new Date();
    }

    static validate(type, data) {
        let schema;
        switch (type) {
            case 'Contact':
                schema = ContactValues.validationSchema();
                break;
            case 'Contractor':
                schema = ContractorValues.validationSchema();
                break;
            case 'PurchaseOrder':
                schema = PurchaseOrderValues.validationSchema();
                break;
            case 'Job':
                schema = JobValues.validationSchema();
                break;
            case 'JobType':
                schema = JobTypeValues.validationSchema();
                break;
            case 'JobPlanning':
                schema = JobPlanningValues.validationSchema();
                break;
            case 'ServiceFeeType':
                schema = ServiceFeeTypeValues.validationSchema();
                break;
            case 'Quote':
                schema = QuoteValues.validationSchema();
                break;
            case 'IsoPlusInvoice':
                schema = IsoPlusInvoiceValues.validationSchema();
                break;
            default:
                throw new Error('Unknown item type');
        }

        return schema.validate(data, { abortEarly: false });
    }
}

class Payload {
    constructor(items) {
        this.items = items;
    }
}

export {
    ItemValues,
    ContactValues,
    ContractorValues,
    PurchaseOrderValues,
    JobValues,
    JobTypeValues,
    JobPlanningValues,
    ServiceFeeTypeValues,
    QuoteValues,
    IsoPlusLineItemValues,
    IsoPlusInvoiceValues,
    Item,
    Payload
};