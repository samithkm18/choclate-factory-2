import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  job_title: { type: String, required: true },
  applicant_name: { type: String, required: true },
  applicant_email: { type: String, required: true },
  applicant_phone: { type: String, required: true },
  experience: { type: String, default: '' },
  cover_note: { type: String, default: '' },
  submitted_at: { type: Date, default: Date.now }
});

export const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);
export default JobApplication;
