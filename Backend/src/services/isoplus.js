import axios from "axios";
import Board from '../models/Board.js';
import FormData from 'form-data';
import { info, warn, error } from '../utils/logger.js';

export async function getWorkspace(authorization, userEmail = null) {
    try {
        const url = "https://app.isoplus.online/api/v2/workspaces";
        const headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };

        let workspace = [];
        const result = await axios.get(url, { headers, params });

        if (result.status === 200) {
            workspace = workspace.concat(result.data.data);
            let has_more = result.data.has_more, after = result.data.after;

            while (has_more) {
                const response = await axios.get(url, { headers, params: { ...params, after } });
                if (response.status === 200) {
                    workspace = workspace.concat(response.data.data);
                    has_more = response.data.has_more;
                    after = response.data.after;
                } else {
                    has_more = false;
                }
            }
        }

        workspace = await Promise.all(workspace.map(async (item) => {
            const board = await getBoard(authorization, item.id);
            const member = await getMember(authorization, item.id);
            let userRole = null;
            if (member.status === 200) {
                userRole = member.members.find(m => m.email && m.email.toLowerCase() === userEmail.toLowerCase())?.role;
            } else {
                userRole = "restricted_member";
            }
            return {
                id: item.id,
                name: item.name,
                label: item.label,
                board: board.board,
                user_role: userRole
            }
        }));

        return { workspace: workspace, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getMyWorkspace(authorization) {
    try {
        const url = "https://app.isoplus.online/api/me/workspaces";

        const headers = {
            Authorization: authorization,
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        let workspace = [];

        const response = await axios.get(url, { headers })
        if (response.status === 200) {
            workspace = workspace.concat(response.data);
        } else {
            return { message: 'Error fetching workspaces', status: 500 };
        }
        return { workspace: workspace, status: 200 };
    } catch (err) {
        return { message: 'Server error', status: 500 };
    }
}

export async function getBoard(authorization, workspaceId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards`;
        const headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };

        let board = [];
        const result = await axios.get(url, { headers, params });

        if (result.status === 200) {
            board = board.concat(result.data.data);
            let has_more = result.data.has_more, after = result.data.after;

            while (has_more) {
                const response = await axios.get(url, { headers, params: { ...params, after } });
                if (response.status === 200) {
                    board = board.concat(response.data.data);
                    has_more = response.data.has_more;
                    after = response.data.after;
                } else {
                    has_more = false;
                }
            }
        }
        return { board: board, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getFolder(workspaceId, boardId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/folders/`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };

        let folder = [];
        const result = await axios.get(url, { headers, params });

        if (result.status === 200) {
            folder = folder.concat(result.data.data);
            let has_more = result.data.has_more, after = result.data.after;

            while (has_more) {
                const response = await axios.get(url, { headers, params: { ...params, after } });
                if (response.status === 200) {
                    folder = folder.concat(response.data.data);
                    has_more = response.data.has_more;
                    after = response.data.after;
                } else {
                    has_more = false;
                }
            }
        }
        return { folder: folder, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getItem(workspaceId, boardId, folderId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/items/`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
            "expand[0]": "values.attribute",
            "folder_id": folderId,
        };

        let item = [];
        const result = await axios.get(url, { headers, params });

        if (result.status === 200) {
            item = item.concat(result.data.data);
            let has_more = result.data.has_more, after = result.data.after;

            while (has_more) {
                const response = await axios.get(url, { headers, params: { ...params, after } });
                if (response.status === 200) {
                    item = item.concat(response.data.data);
                    has_more = response.data.has_more;
                    after = response.data.after;
                } else {
                    has_more = false;
                }
            }
        }
        return { item: item, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getMember(authorization, workspaceId) {
    try {
        const membersUrl = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/members`;
        const membersHeaders = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        };
        const membersParams = {
            "limit": "10",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };
        let members = [];
        let has_more = true;
        let after = undefined;
        while (has_more) {
            const paramsWithAfter = after ? { ...membersParams, after } : membersParams;
            const membersRes = await axios.get(membersUrl, { headers: membersHeaders, params: paramsWithAfter });
            if (membersRes.status === 200 && Array.isArray(membersRes.data.data)) {
                members = members.concat(membersRes.data.data);
                has_more = membersRes.data.has_more;
                after = membersRes.data.after;
            } else {
                has_more = false;
            }
        }
        return { members: members, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getAllViews(authorization, workspaceId, boardId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/views`;
        const headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };

        let views = [];
        let has_more = true;
        let after = null;

        while (has_more) {
            const result = await axios.get(url, { headers, params: { ...params, after } });
            if (result.status === 200) {
                views = views.concat(result.data.data);
                has_more = result.data.has_more;
                after = result.data.after;
            } else {
                has_more = false;
            }
        }
        return { views: views, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function getViewsById(authorization, workspaceId, boardId, viewId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/views/${viewId}`;
        const headers = {
            "Authorization": authorization,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };

        const result = await axios.get(url, { headers, params });

        return result.status === 200 ? result.data : null;
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function putInternalMessage(workspaceId, boardId, itemId, message) {
    try {
        const board = await Board.findOne({ boardId });
        await axios.put(
            `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`,
            {
                "values": [
                    {
                        "attribute_id": board.attribute.id || process.env.INTEGRATION_MESSAGE_ATTRIBUTE_ID || "b84bf475-b4f7-4e35-891a-72c24631468f",
                        "data": `<p>${message}</p>`
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-API-Version": "2025-02-26.morava",
                }
            }
        );
        return true;
    } catch (err) {
        error('ISO+™ Service', 'Error putting internal message:', err);
        return false;
    }
}

export function putTimeTracking(workspaceId, boardId, itemId, startTime, endTime) {
    axios.put(`https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`, {
        "values": [
            {
                "attribute_id": "b16e64b3-2e79-46af-ae87-3135005d362b",
                "data": `${new Date(startTime).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
            }, {
                "attribute_id": "00ece0a4-b3bc-43e1-8580-23854b062439",
                "data": `${new Date(endTime).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
            }
        ],
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        }
    });
    return true;
};

export async function getItemValues(workspaceId, boardId, itemId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}?expand[]=values.attribute`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        };

        const result = await axios.get(url, { headers });
        return result.status === 200 ? result.data : null;
    } catch (err) {
        error('ISO+™ Service', 'Error getting item values:', err);
        return null;
    }
}

export async function validateItemBelongsToTenant(workspaceId, boardId, itemId) {
    const validatedItemOwnership = await getItemValues(workspaceId, boardId, itemId);
    if (!validatedItemOwnership) {
        const errorMessage = "CRITICAL: Item does not exist. This may be a result of an intrusion attempt or misconfiguration of the tenant!";
        warn('ISO+™ Service', errorMessage);
        throw new Error(errorMessage);
    }
}

export async function getReferences(workspaceId, boardId, itemId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/references?from_item_id=${itemId}`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        const result = await axios.get(url, { headers });
        return result.status === 200 ? result.data : null;
    } catch (err) {
        error('ISO+™ Service', 'Error getting references:', err);
        return null;
    }
}

export async function getAttribute(workspaceId, boardId, attributeId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/attributes/${attributeId}`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Version": "2025-02-26.morava",
        };

        const result = await axios.get(url, { headers });
        return result.status === 200 ? result.data : null;
    } catch (err) {
        error('ISO+™ Service', 'Error getting attribute:', err);
        return null;
    }
}

export async function getJobReportingReferencedItems(workspaceId, boardId, itemId) {
    let serviceFeeTypeValues = null;
    let jobPlanningValues = null;

    const referenceResponse = await getReferences(workspaceId, boardId, itemId);
    if (!referenceResponse) return [null, null];

    for (const reference of referenceResponse.data) {
        const attribute = await getAttribute(workspaceId, boardId, reference.attribute_id);
        if (!attribute) continue;

        switch (attribute.name) {
            case "Job Number": {
                const jobPlanningItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (jobPlanningItemValues) {
                    const values = jobPlanningItemValues.values;
                    if (!values.some(v => v.attribute.name === "Job Number")) {
                        throw new Error("Job Number is required");
                    }
                    if (!values.some(v => v.attribute.name === "Client's Order Number")) {
                        throw new Error("Client's Order Number is required");
                    }
                    if (!values.some(v => v.attribute.name === "Job Title")) {
                        throw new Error("Job Title is required");
                    }

                    jobPlanningValues = {
                        id: jobPlanningItemValues.id,
                        jobNumber: values.find(v => v.attribute.name === "Job Number").data.toString(),
                        clientOrderNumber: values.find(v => v.attribute.name === "Client's Order Number").data.toString(),
                        jobTitle: values.find(v => v.attribute.name === "Job Title").data.toString()
                    };
                }
                break;
            }
            case "Service Fee Type": {
                const serviceFeeTypeItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (serviceFeeTypeItemValues) {
                    const values = serviceFeeTypeItemValues.values;
                    if (!values.some(v => v.attribute.name === "Fee Type")) {
                        throw new Error("Fee Type is required");
                    }

                    serviceFeeTypeValues = {
                        feeType: values.find(v => v.attribute.name === "Fee Type").data.toString(),
                        rate: parseFloat(values.find(v => v.attribute.name === "Rate($) - GST Excl.").data.toString())
                    };
                }
                break;
            }
        }
    }

    return [jobPlanningValues, serviceFeeTypeValues];
}

export async function getJobPlanningReferencedItems(workspaceId, boardId, itemId) {
    let contactValues = null;
    let jobTypeValues = null;

    const referenceResponse = await getReferences(workspaceId, boardId, itemId);
    if (!referenceResponse) return [null, null];

    for (const reference of referenceResponse.data) {
        const attribute = await getAttribute(workspaceId, boardId, reference.attribute_id);
        if (!attribute) continue;

        switch (attribute.name) {
            case "Client": {
                const clientItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (clientItemValues) {
                    const values = clientItemValues.values;
                    if (!values.some(v => v.attribute.name === "Client")) {
                        throw new Error("Client is required");
                    }
                    if (!values.some(v => v.attribute.name === "Email Address")) {
                        throw new Error("Client email address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Phone Number")) {
                        throw new Error("Client phone number is required");
                    }
                    if (!values.some(v => v.attribute.name === "Address")) {
                        throw new Error("Client address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Suburb")) {
                        throw new Error("Client suburb is required");
                    }
                    if (!values.some(v => v.attribute.name === "State")) {
                        throw new Error("Client state is required");
                    }
                    if (!values.some(v => v.attribute.name === "Postcode")) {
                        throw new Error("Client postcode is required");
                    }

                    const stateElement = values.find(v => v.attribute.name === "State").data;
                    let stateId = "";
                    if (stateElement && stateElement[0]) {
                        stateId = stateElement[0].toString();
                    }

                    const stateLabel = stateId && values.find(v => v.attribute.name === "State").attribute.settings.labels.find(l => l.id === stateId);

                    contactValues = {
                        client: values.find(v => v.attribute.name === "Client").data.toString(),
                        emailAddress: values.find(v => v.attribute.name === "Email Address").data.toString(),
                        phoneNumber: values.find(v => v.attribute.name === "Phone Number").data.toString(),
                        address: values.find(v => v.attribute.name === "Address").data.toString(),
                        suburb: values.find(v => v.attribute.name === "Suburb").data.toString(),
                        state: stateLabel ? stateLabel.name : "",
                        postcode: parseInt(values.find(v => v.attribute.name === "Postcode").data.toString()),
                        contactPersonsFirstName: values.some(v => v.attribute.name === "Contact Person's First Name")
                            ? values.find(v => v.attribute.name === "Contact Person's First Name").data.toString()
                            : "",
                        contactPersonsLastName: values.some(v => v.attribute.name === "Contact Person's Last Name")
                            ? values.find(v => v.attribute.name === "Contact Person's Last Name").data.toString()
                            : "",
                        updatedAt: values.some(v => v.attribute.name === "Updated At")
                            ? values.find(v => v.attribute.name === "Updated At").data.toString()
                            : "",
                    };
                }
                break;
            }
            case "Job Type": {
                const jobTypeItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (jobTypeItemValues) {
                    const values = jobTypeItemValues.values;
                    if (!values.some(v => v.attribute.name === "Job Type")) {
                        throw new Error("Job Type is required");
                    }
                    if (!values.some(v => v.attribute.name === "Job Code")) {
                        throw new Error("Job Code is required");
                    }

                    jobTypeValues = {
                        jobType: values.find(v => v.attribute.name === "Job Type").data.toString(),
                        jobCode: values.find(v => v.attribute.name === "Job Code").data.toString(),
                    };
                }
                break;
            }
        }
    }

    return [contactValues, jobTypeValues];
}

export async function getQuoteReferencedItems(workspaceId, boardId, itemId) {
    let contactValues = null;
    let jobTypeValues = null;

    const referenceResponse = await getReferences(workspaceId, boardId, itemId);
    if (!referenceResponse) return [null, null];

    for (const reference of referenceResponse.data) {
        const attribute = await getAttribute(workspaceId, boardId, reference.attribute_id);
        if (!attribute) continue;

        switch (attribute.name) {
            case "Client": {
                const clientItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (clientItemValues) {
                    const values = clientItemValues.values;
                    if (!values.some(v => v.attribute.name === "Client")) {
                        throw new Error("Client is required");
                    }
                    if (!values.some(v => v.attribute.name === "Email Address")) {
                        throw new Error("Client email Address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Phone Number")) {
                        throw new Error("Client phone number is required");
                    }
                    if (!values.some(v => v.attribute.name === "Address")) {
                        throw new Error("Client address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Suburb")) {
                        throw new Error("Client suburb is required");
                    }
                    if (!values.some(v => v.attribute.name === "State")) {
                        throw new Error("Client state is required");
                    }
                    if (!values.some(v => v.attribute.name === "Postcode")) {
                        throw new Error("Client postcode is required");
                    }

                    const stateElement = values.find(v => v.attribute.name === "State").data;
                    let stateId = "";
                    if (stateElement && stateElement[0]) {
                        stateId = stateElement[0].toString();
                    }

                    const stateLabel = stateId && values.find(v => v.attribute.name === "State").attribute.settings.labels.find(l => l.id === stateId);

                    contactValues = {
                        client: values.find(v => v.attribute.name === "Client").data.toString(),
                        emailAddress: values.find(v => v.attribute.name === "Email Address").data.toString(),
                        phoneNumber: values.find(v => v.attribute.name === "Phone Number").data.toString(),
                        address: values.find(v => v.attribute.name === "Address").data.toString(),
                        suburb: values.find(v => v.attribute.name === "Suburb").data.toString(),
                        state: stateLabel ? stateLabel.name : "",
                        postcode: parseInt(values.find(v => v.attribute.name === "Postcode").data.toString()),
                        contactPersonsFirstName: values.some(v => v.attribute.name === "Contact Person's First Name")
                            ? values.find(v => v.attribute.name === "Contact Person's First Name").data.toString()
                            : "",
                        contactPersonsLastName: values.some(v => v.attribute.name === "Contact Person's Last Name")
                            ? values.find(v => v.attribute.name === "Contact Person's Last Name").data.toString()
                            : "",
                        updatedAt: values.some(v => v.attribute.name === "Updated At")
                            ? values.find(v => v.attribute.name === "Updated At").data.toString()
                            : "",
                    };
                }
                break;
            }
            case "Job Type": {
                const jobTypeItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (jobTypeItemValues) {
                    const values = jobTypeItemValues.values;
                    if (!values.some(v => v.attribute.name === "Job Type")) {
                        throw new Error("Job Type is required");
                    }
                    if (!values.some(v => v.attribute.name === "Job Code")) {
                        throw new Error("Job Code is required");
                    }

                    jobTypeValues = {
                        jobType: values.find(v => v.attribute.name === "Job Type").data.toString(),
                        jobCode: values.find(v => v.attribute.name === "Job Code").data.toString(),
                    };
                }
                break;
            }
        }
    }

    return [contactValues, jobTypeValues];
}

export async function getPurchaseOrderReferencedItems(workspaceId, boardId, itemId) {
    let contractorValues = null;
    let jobTypeValues = null;

    const referenceResponse = await getReferences(workspaceId, boardId, itemId);
    if (!referenceResponse) return [null, null];

    for (const reference of referenceResponse.data) {
        const attribute = await getAttribute(workspaceId, boardId, reference.attribute_id);
        if (!attribute) continue;

        switch (attribute.name) {
            case "Contractor": {
                const supplierItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (supplierItemValues) {
                    const values = supplierItemValues.values;
                    if (!values.some(v => v.attribute.name === "Contractor")) {
                        throw new Error("Contractor is required");
                    }
                    if (!values.some(v => v.attribute.name === "Email Address")) {
                        throw new Error("Contractor email Address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Phone Number")) {
                        throw new Error("Contractor phone number is required");
                    }
                    if (!values.some(v => v.attribute.name === "Address")) {
                        throw new Error("Contractor address is required");
                    }
                    if (!values.some(v => v.attribute.name === "Suburb")) {
                        throw new Error("Contractor suburb is required");
                    }
                    if (!values.some(v => v.attribute.name === "State")) {
                        throw new Error("Contractor state is required");
                    }
                    if (!values.some(v => v.attribute.name === "Postcode")) {
                        throw new Error("Contractor postcode is required");
                    }

                    const stateElement = values.find(v => v.attribute.name === "State").data;
                    let stateId = "";
                    if (stateElement && stateElement[0]) {
                        stateId = stateElement[0].toString();
                    }

                    const stateLabel = stateId && values.find(v => v.attribute.name === "State").attribute.settings.labels.find(l => l.id === stateId);

                    contractorValues = {
                        contractor: values.find(v => v.attribute.name === "Contractor").data.toString(),
                        emailAddress: values.find(v => v.attribute.name === "Email Address").data.toString(),
                        phoneNumber: values.find(v => v.attribute.name === "Phone Number").data.toString(),
                        address: values.find(v => v.attribute.name === "Address").data.toString(),
                        suburb: values.find(v => v.attribute.name === "Suburb").data.toString(),
                        state: stateLabel ? stateLabel.name : "",
                        postcode: parseInt(values.find(v => v.attribute.name === "Postcode").data.toString()),
                        contactPersonsFirstName: values.some(v => v.attribute.name === "Contact Person's First Name")
                            ? values.find(v => v.attribute.name === "Contact Person's First Name").data.toString()
                            : "",
                        contactPersonsLastName: values.some(v => v.attribute.name === "Contact Person's Last Name")
                            ? values.find(v => v.attribute.name === "Contact Person's Last Name").data.toString()
                            : "",
                        updatedAt: values.some(v => v.attribute.name === "Updated At")
                            ? values.find(v => v.attribute.name === "Updated At").data.toString()
                            : "",
                    };
                }
                break;
            }
            case "Job Type": {
                const jobTypeItemValues = await getItemValues(workspaceId, boardId, reference.to_item_id);
                if (jobTypeItemValues) {
                    const values = jobTypeItemValues.values;
                    if (!values.some(v => v.attribute.name === "Job Type")) {
                        throw new Error("Job Type is required");
                    }
                    if (!values.some(v => v.attribute.name === "Job Code")) {
                        throw new Error("Job Code is required");
                    }

                    jobTypeValues = {
                        jobType: values.find(v => v.attribute.name === "Job Type").data.toString(),
                        jobCode: values.find(v => v.attribute.name === "Job Code").data.toString(),
                    };
                }
                break;
            }
        }
    }

    return [contractorValues, jobTypeValues];
}

export async function getBoardAttributes(workspaceId, boardId) {
    try {
        const url = `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/attributes`;
        const headers = {
            "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        const params = {
            "limit": "100",
            "sort_by": "created_at",
            "sort_direction": "desc",
        };

        let attribute = [];
        const result = await axios.get(url, { headers, params });

        if (result.status === 200) {
            attribute = attribute.concat(result.data.data);
            let has_more = result.data.has_more, after = result.data.after;

            while (has_more) {
                const response = await axios.get(url, { headers, params: { ...params, after } });
                if (response.status === 200) {
                    attribute = attribute.concat(response.data.data);
                    has_more = response.data.has_more;
                    after = response.data.after;
                } else {
                    has_more = false;
                }
            }
        }
        return { attribute: attribute, status: 200 };
    } catch (err) {
        return { message: err.message, status: 500 };
    }
}

export async function setIntegrationMessage(workspaceId, boardId, itemId, message) {
    try {
        const response = await putInternalMessage(workspaceId, boardId, itemId, message);
        if (!response) {
            throw new Error("Failed to update item with integration message in ISO+™.");
        }
    } catch (err) {
        error('ISO+™ Service', 'Error setting integration message:', err);
        throw err;
    }
}

export async function setLogo(authorization, workspaceId, logo, type, req) {
    try {
        const boards = await getBoard(authorization, workspaceId);
        const body = new FormData();
        body.append('file', logo.buffer, logo.originalname);

        const uploadImageURL = await axios.post(
            `https://app.isoplus.online/api/v2/workspaces/${workspaceId}/attachments/file`,
            body,
            {
                headers: {
                    "Authorization": authorization,
                    ...body.getHeaders(),
                    "Accept": "application/json",
                },
            }
        );

        if (uploadImageURL.status == 201 && boards.status === 200 && boards.board?.length > 0) {
            for (const boardItem of boards.board) {
                const response = await getAllViews(authorization, workspaceId, boardItem.id);
                if (response.status !== 200) {
                    warn(`ISO+™ Service`, `Failed to fetch views for board ${boardItem.id}`, { response }, req);
                    continue;
                }
                const views = response.views.filter(item => item.type.toLowerCase() === type);
                if (!views || views.length === 0) {
                    warn(`ISO+™ Service`, `No views found for board ${boardItem.id}`, { response }, req);
                    continue;
                }
                if (type == "form") {
                    for (const viewItem of views) {
                        const updateView = {
                            ...viewItem,
                            settings: {
                                ...viewItem.settings,
                                formSettings: {
                                    ...viewItem.settings.formSettings,
                                    logoImageUrl: uploadImageURL.data.link
                                }
                            },
                        };
                        try {
                            await axios.put(`https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardItem.id}/views/${viewItem.id}`, updateView, {
                                headers: {
                                    "Authorization": authorization,
                                    "Content-Type": "application/json",
                                    "Accept": "application/json"
                                }
                            });
                            info('ISO+™ Service', `Logo set successfully for view: ${viewItem.id}`);
                        } catch (err) {
                            error('ISO+™ Service', `Error setting logo for view: ${err.response?.data || err.message}`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } else if (type == "document") {
                    for (const viewItem of views) {
                        const coverAttributeid = viewItem.settings.editorCoverAttributeId;
                        if (!coverAttributeid) {
                            warn(`ISO+™ Service`, `No cover attribute id found for view ${viewItem.id}`, { viewItem }, req);
                            continue;
                        }
                        const items = await getItem(workspaceId, boardItem.id, viewItem.folder_id);
                        if (items.status == 200 && items.item && items.item.length > 0) {
                            for (const item of items.item) {
                                const itemValues = await getItemValues(workspaceId, boardItem.id, item.id);
                                if (itemValues) {
                                    let doc = itemValues.values.find(v => v.attribute.id == coverAttributeid);
                                    if (doc) {
                                        doc.data.push({ id: uploadImageURL.data.id });
                                    } else {
                                        doc = { data: [{ id: uploadImageURL.data.id }], attribute: { id: coverAttributeid } };
                                    }
                                    try {
                                        await axios.put(`https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardItem.id}/items/${item.id}`,
                                            { values: [{ data: doc.data, attribute_id: doc.attribute.id }] },
                                            {
                                                headers: {
                                                    "Authorization": authorization,
                                                    "Content-Type": "application/json",
                                                    "Accept": "application/json"
                                                }
                                            }
                                        );
                                        if (response.status === 200) {
                                            if (item.id in viewItem.settings.editorItems) {
                                                viewItem.settings.editorItems[item.id].cover = uploadImageURL.data.id;
                                            } else {
                                                viewItem.settings.editorItems[item.id] = { cover: uploadImageURL.data.id };
                                            }
                                        }
                                    } catch (err) {
                                        error('ISO+™ Service', 'Error updating item for document logo:', err.response?.data || err.message);
                                    }
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                            try {
                                await axios.put(`https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardItem.id}/views/${viewItem.id}`, viewItem, {
                                    headers: {
                                        "Authorization": authorization,
                                        "Content-Type": "application/json",
                                        "Accept": "application/json"
                                    }
                                });
                                info('ISO+™ Service', `Logo set successfully for view: ${viewItem.id}`);
                            } catch (err) {
                                error('ISO+™ Service', 'Error setting logo for view:', err.response?.data || err.message);
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        } else {
            throw new Error("Failed to fetch boards");
        }
    } catch (err) {
        error('ISO+™ Service', 'Error setting form logo:', err?.response?.data || err?.message || err);
        return null;
    }
}

export async function setGeneratedField(workspaceId, boardId, itemId, message) {
    try {
        const itemValues = await getItemValues(workspaceId, boardId, itemId);
        if (!itemValues) {
            throw new Error("Failed to update item with integration message");
        }
        const values = itemValues.values;
        const generatedField = values.find(v => v.attribute.name.includes("Generated") && v.attribute.name.includes("Number") && v.attribute.type === "text");
        if (generatedField) {
            const response = await axios.put(`https://app.isoplus.online/api/v2/workspaces/${workspaceId}/boards/${boardId}/items/${itemId}`,
                { values: [{ data: message, attribute_id: generatedField.attribute.id }] },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.PERSONAL_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-API-Version": "2025-02-26.morava",
                    }
                });
            if (response.status === 200) {
                return true;
            }
        }
        return false;
    } catch (err) {
        error('ISO+™ Service', 'Error setting generated field:', err);
        throw err;
    }
}
