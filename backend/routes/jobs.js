import express from 'express';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/jobs - List published job openings for customers
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ is_published: true }).sort({ posted_date: -1 });
    const mapped = jobs.map(j => {
      const obj = j.toObject();
      return { ...obj, id: obj._id.toString() };
    });
    return res.json(mapped);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ message: 'Error retrieving job openings.' });
  }
});

// GET /api/jobs/:id - Get single job details
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found.' });
    }
    const obj = job.toObject();
    return res.json({ ...obj, id: obj._id.toString() });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ message: 'Error retrieving job details.' });
  }
});

// POST /api/jobs/:id/apply - Submit job application
router.post('/:id/apply', async (req, res) => {
  const { applicant_name, applicant_email, applicant_phone, experience, cover_note } = req.body;

  if (!applicant_name || !applicant_email || !applicant_phone) {
    return res.status(400).json({ message: 'Name, email, and phone number are required.' });
  }

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found.' });
    }

    const application = new JobApplication({
      job_id: job._id,
      job_title: job.title,
      applicant_name,
      applicant_email,
      applicant_phone,
      experience: experience || '',
      cover_note: cover_note || ''
    });

    await application.save();
    return res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Error submitting job application:', error);
    return res.status(500).json({ message: 'Could not submit application.' });
  }
});

export default router;
