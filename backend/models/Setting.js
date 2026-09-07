import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' }
});

export const Setting = mongoose.model('Setting', SettingSchema);
export default Setting;
