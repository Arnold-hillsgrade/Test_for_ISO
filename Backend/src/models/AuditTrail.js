import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AuditTrailSchema = new Schema({
    workspaceId: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    detail: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        default: ""
    },
    userIp: {
        type: String,
        default: "127.0.0.1"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('AuditTrail', AuditTrailSchema);