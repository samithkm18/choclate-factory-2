import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner', 'mwc'], default: 'user' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  google_id: { type: String },
  profile_image: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export default User;
