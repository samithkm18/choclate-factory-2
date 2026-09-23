import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: { type: String, default: '' },
  required_skills: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  experience: { type: String, default: '' },
  location: { type: String, default: 'Mysuru, Karnataka' },
  employment_type: { type: String, default: 'Full-Time' },
  posted_date: { type: Date, default: Date.now },
  application_deadline: { type: String, default: 'Open until filled' },
  is_published: { type: Boolean, default: true }
});

export const Job = mongoose.model('Job', JobSchema);
export default Job;
