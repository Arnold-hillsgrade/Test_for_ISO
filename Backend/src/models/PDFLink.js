import  mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PDFLinkSchema = new Schema({
    itemId: {
        type: String,
        required: true
    },
    workspaceId: {
        type: String,
        required: true
    },
    pdfLink: {
        type: String,
        required: true
    },
    SignatureStatus: {
        type: String,
        default: 'Unsigned'
    },
    type: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.model('PDFLink', PDFLinkSchema);