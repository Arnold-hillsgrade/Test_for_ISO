import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  boardId: {
    type: String,
    ref: 'Board',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
  },
  og_image: {
    type: String,
  },
  label: {
    type: String,
    default: 'No Label'
  },
  attribute: {
    id: {
      type: String,
      ref: 'Attribute Id',
      required: false
    },
    name: {
      type: String,
      ref: 'Attribute Name',
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Board', boardSchema);