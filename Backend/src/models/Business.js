import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    ref: 'WorkSpace'
  },
  name: {
    type: String
  },
  defaultLogo: {
    type: String
  },
  squareLogo: {
    type: String
  },
  wideLogo: {
    type: String
  },
  address: {
    street: {
      type: String
    },
    country: {
      type: String
    },
    suburb: {
      type: String
    },
    state: {
      type: String
    },
    postcode: {
      type: String
    }
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  abn: {
    type: String
  },
  acn: {
    type: String
  },
  xeroIntegrated: {
    type: Boolean,
    default: false
  },
  xeroTokens: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Number
  },
  bankDetails: {
    accountName: {
      type: String
    },
    bankName: {
      type: String
    },
    bsb: {
      type: String
    },
    accountNumber: {
      type: String
    },
    accountsReceivableTerms: {
      type: String
    },
    accountsPayableTerms: {
      type: String
    }
  },
  documentNumbering: {
    invoice: {
      prefix: {
        type: String,
        default: 'INV-'
      },
      nextNumber: {
        type: Number,
        default: 1000
      }
    },
    purchaseOrder: {
      prefix: {
        type: String,
        default: 'PO-'
      },
      nextNumber: {
        type: Number,
        default: 1000
      }
    },
    quote: {
      prefix: {
        type: String,
        default: 'QT-'
      },
      nextNumber: {
        type: Number,
        default: 1000
      }
    }
  }
});

export default mongoose.model('Business', businessSchema);