import { XeroClient } from 'xero-node';
import Business from '../models/Business.js';
import { info, error } from '../utils/logger.js';
import {
    IsoPlusInvoiceValues
} from '../dto/itemsPayload.js';

let xeroClient = null;

export async function configure() {
    try {
        const config = {
            clientId: process.env.XERO_CLIENT_ID,
            clientSecret: process.env.XERO_CLIENT_SECRET,
            scopes: 'openid profile email accounting.settings accounting.contacts accounting.transactions accounting.reports.read accounting.attachments offline_access'.split(" "),
        };

        if (process.env.XERO_REDIRECT_URL) {
            config.grantType = 'authorization_code';
            config.redirectUris = [process.env.XERO_REDIRECT_URL];
        } else {
            config.grantType = 'client_credentials';
        }

        xeroClient = new XeroClient(config);
        return xeroClient;
    } catch (err) {
        error('Xero-Service', 'Error configuring Xero client', err);
        throw new Error('Error configuring Xero client');
    }
}

export async function getAuthUrl() {
    if (!xeroClient) {
        throw new Error('Xero client is not configured.');
    }

    const scopes = 'openid profile email accounting.settings accounting.contacts accounting.transactions accounting.reports.read accounting.attachments offline_access'.split(" ");
    const state = Math.random().toString(36).substring(7);
    const url = await xeroClient.buildConsentUrl(scopes, state);
    return url;
}

export async function callback(code, url) {
    try {
        await xeroClient.apiCallback(url);
        const tokenSet = xeroClient.readTokenSet();
        const tenants = await xeroClient.updateTenants(false);
        return {
            success: true,
            message: 'Successfully connected to Xero!',
            tokenSet,
            tenants
        };
    } catch (err) {
        error('Xero-Service', 'Error in Xero callback', err);
        return {
            success: false,
            message: 'Failed to authenticate: ' + err.message
        };
    }
}

export async function exchangeCode(code) {
    try {
        if (!xeroClient) {
            throw new Error('Xero client is not configured.');
        }

        const tokenSet = await xeroClient.apiCallback(code);
        if (!tokenSet || !tokenSet.access_token) {
            throw new Error('Access token is undefined! Please ensure the authorization code is valid.');
        }

        return tokenSet;
    } catch (err) {
        error('Xero-Service', 'Error exchanging authorization code', err);
        throw new Error('Error exchanging authorization code');
    }
}

export async function refreshTokenSet(tokenSet) {
    try {
        if (!xeroClient) {
            throw new Error('Xero client is not configured.');
        }

        const newTokenSet = await xeroClient.refreshToken(tokenSet);
        return newTokenSet;
    } catch (err) {
        error('Xero-Service', 'Error refreshing token', err);
        throw new Error('Error refreshing token');
    }
}

export async function createToken() {
    try {
        if (!xeroClient) {
            throw new Error('Xero client is not configured.');
        }

        const token = await xeroClient.readTokenSet();
        const connections = await xeroClient.updateTenants(false) || [];
        const xeroTenantId = connections[0]?.tenantId || null;

        return { token, xeroTenantId };
    } catch (err) {
        error('Xero-Service', 'Error creating token', err);
        throw new Error('Error creating token');
    }
}

export async function createInvoice(invoice) {
    const {
        type,
        lineItems,
        currencyCode,
        lineAmountTypes,
        date,
        dueDate,
        status,
        reference,
        customerName,
        amount
    } = invoice;
    const contactID = invoice.contact?.contactID || invoice.contactID;
    const validationObj = {
        type,
        contactID,
        lineItems,
        currencyCode,
        lineAmountTypes,
        date,
        dueDate,
        status,
        reference,
        customerName,
        amount
    };
    const { error: validationError } = IsoPlusInvoiceValues.validationSchema().validate(validationObj, { abortEarly: false });
    if (validationError) {
        throw new Error('Invoice validation failed: ' + validationError.details.map(d => d.message).join('; '));
    }
    try {
        if (!xeroClient) {
            throw new Error('Xero client not configured');
        }

        await xeroClient.updateTenants(false);
        if (!xeroClient.tenants?.length) {
            throw new Error('No organizations connected');
        }
        const tenantId = xeroClient.tenants[0].tenantId;

        const invoiceData = {
            invoices: [{
                type: invoice.type || 'ACCREC',
                contact: { contactID: invoice.contact.contactID },
                reference: invoice.reference,
                dueDate: new Date(invoice.dueDate).toISOString().split('T')[0], // YYYY-MM-DD format
                lineItems: invoice.lineItems.map(item => ({
                    itemCode: item.itemCode,
                    description: item.description,
                    quantity: item.quantity,
                    unitAmount: item.unitAmount,
                    taxType: item.taxType,
                })),
                status: invoice.status || 'AUTHORISED'
            }]
        };

        const response = await xeroClient.accountingApi.createInvoices(
            tenantId,
            invoiceData
        );

        return response.body.invoices[0];
    } catch (err) {
        error('Xero-Service', 'Invoice creation failed:', err);
        let jsonString = Object.values(err).join('');
        let errorMessage = JSON.parse(jsonString);
        if (errorMessage.response?.statusCode === 403) {
            throw new Error('Authentication failed. Please re-authenticate.');
        }
        if (errorMessage.response?.body) {
            throw new Error(`Xero API Error: ${JSON.stringify(errorMessage.response.body)}`);
        }
        throw new Error(`Invoice creation failed: ${err.message}`);
    }
}

export async function getContactByEmail(email) {
    try {
        const { tokenSet, xeroTenantId } = await createToken();

        const response = await xeroClient.accountingApi.getContacts(
            xeroTenantId,
            null,
            `EmailAddress=="${email}"`
        );

        return response.body.contacts[0];
    } catch (err) {
        error('Xero-Service', 'Error retrieving contact from Xero', err);

        if (err.response?.statusCode === 403) {
            throw new Error('Permission denied. Ensure your app has accounting.contacts scope.');
        }
        if (err.response?.statusCode === 401) {
            throw new Error('Authentication expired. Please re-authenticate.');
        }

        throw new Error('Error retrieving contact from Xero: ' + err.message);
    }
}

export async function createOrUpdateContact(contact) {
    try {
        const { xeroTenantId } = await createToken();
        const contacts = {
            contacts: [contact],
        };

        let response;
        if (!contact.contactID) {
            response = await xeroClient.accountingApi.createContacts(
                xeroTenantId,
                contacts
            );
        } else {
            response = await xeroClient.accountingApi.updateContact(
                xeroTenantId,
                contact.contactID,
                contacts
            );
        }

        return response.body.contacts[0];
    } catch (err) {
        error('Xero-Service', 'Error creating or updating contact in Xero', err);
        throw new Error('Error creating or updating contact in Xero');
    }
}

export async function findOrCreateItem(itemCode, itemName) {
    if (!itemCode || typeof itemCode !== 'string' || !itemName || typeof itemName !== 'string') {
        throw new Error('Item validation failed: itemCode and itemName are required and must be strings.');
    }
    try {
        if (!xeroClient) {
            throw new Error('Xero client not configured');
        }

        await xeroClient.updateTenants(false);
        const tenantId = xeroClient.tenants[0].tenantId;

        const searchResponse = await xeroClient.accountingApi.getItems(
            tenantId,
            null,
            `Code=="${itemCode}"`
        );

        if (searchResponse.body.items?.length > 0) {
            return searchResponse.body.items[0];
        }

        const newItem = {
            code: itemCode,
            name: itemName,
        };

        const createResponse = await xeroClient.accountingApi.createItems(
            tenantId,
            { items: [newItem] }
        );

        return createResponse.body.items[0];

    } catch (err) {
        error('Xero-Service', 'Item operation failed:', err);

        if (err.response?.statusCode === 403) {
            throw new Error('Missing accounting.settings scope');
        }
        if (err.message && err.message.includes('toISOString')) {
            throw new Error('Invalid date parameter in API request');
        }

        throw new Error(`Item operation failed: ${err.message}`);
    }
}

export async function createQuote(quote) {
    try {
        const { token, xeroTenantId } = await createToken();

        const quotes = {
            quotes: [quote],
        };

        const createdQuotes = await xeroClient.accountingApi.createQuotes(
            xeroTenantId,
            quotes
        );

        return createdQuotes.body.quotes[0];
    } catch (err) {
        error('Xero-Service', 'Error creating quote in Xero', err);
        throw new Error('Error creating quote in Xero');
    }
}

export async function quoteExists(quoteNumber) {
    try {
        const { token, xeroTenantId } = await createToken();

        const response = await xeroClient.accountingApi.getQuotes(
            xeroTenantId,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            quoteNumber
        );

        return response.body.quotes.length > 0;
    } catch (err) {
        error('Xero-Service', 'Error checking if quote exists in Xero', err);
        throw new Error('Error checking if quote exists in Xero');
    }
}

export async function purchaseOrderExists(purchaseOrderNumber) {
    try {
        if (!purchaseOrderNumber) {
            return false;
        }

        const { token, xeroTenantId } = await createToken();

        const response = await xeroClient.accountingApi.getPurchaseOrderByNumber(
            xeroTenantId,
            purchaseOrderNumber
        );

        return response.body.purchaseOrders.length > 0;
    } catch (err) {
        error('Xero-Service', 'Error checking if purchase order exists in Xero', err);
        return false;
    }
}

export async function createPurchaseOrder(purchaseOrder) {
    try {
        const { token, xeroTenantId } = await createToken();

        const purchaseOrders = {
            purchaseOrders: [purchaseOrder],
        };

        const createdPurchaseOrders = await xeroClient.accountingApi.createPurchaseOrders(
            xeroTenantId,
            purchaseOrders
        );

        return createdPurchaseOrders.body.purchaseOrders[0];
    } catch (err) {
        error('Xero-Service', 'Error creating purchase order in Xero', err);
        throw new Error('Error creating purchase order in Xero');
    }
}

export async function ensureAuthenticated(accessToken, refreshToken, expiresAt) {
    if (!xeroClient) {
        throw new Error('Xero client not configured');
    }

    await xeroClient.setTokenSet({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        token_type: 'Bearer',
        scopes: 'openid profile email accounting.settings accounting.contacts accounting.transactions accounting.reports.read accounting.attachments offline_access'.split(" "),
    });

    const currentTokenSet = xeroClient.readTokenSet();
    if (currentTokenSet) {
        if (currentTokenSet.expired() && currentTokenSet.refresh_token) {
            try {
                const newTokenSet = await xeroClient.refreshWithRefreshToken(process.env.XERO_CLIENT_ID, process.env.XERO_CLIENT_SECRET, currentTokenSet.refresh_token);
                await Business.updateOne({ 'xeroTokens.accessToken': accessToken, 'xeroTokens.refreshToken': refreshToken }, { $set: { 'xeroTokens.accessToken': newTokenSet.access_token, 'xeroTokens.refreshToken': newTokenSet.refresh_token, 'xeroTokens.expiresAt': newTokenSet.expires_at } })
            } catch (refreshError) {
                error('Xero-Service', 'Error refreshing token', refreshError);
                throw new Error('Your Xero authorization token is expired. Please go to ISOPlus Portal and authorize again.');
            }
        }
    } else {
        throw new Error('Not authenticated with Xero');
    }

    const tenants = await xeroClient.updateTenants(false);

    if (!tenants || !tenants.length) {
        throw new Error('No Xero organizations connected');
    }
}