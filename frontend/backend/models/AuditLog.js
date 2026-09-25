import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String },
  ip_address: { type: String },
  operator_name: { type: String },
  operator_email: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
