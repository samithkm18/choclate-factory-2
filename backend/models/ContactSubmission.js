import mongoose from 'mongoose';

const ContactSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: 'Customer Contact Inquiry' },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  created_at: { type: Date, default: Date.now }
});

export const ContactSubmission = mongoose.model('ContactSubmission', ContactSubmissionSchema);
export default ContactSubmission;
