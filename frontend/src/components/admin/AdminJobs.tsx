import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit, Trash2, Eye, Check, X, AlertCircle } from 'lucide-react';

interface Job {
  id: string;
  _id?: string;
  title: string;
  department: string;
  description: string;
  responsibilities?: string;
  required_skills?: string;
  qualifications?: string;
  experience?: string;
  location?: string;
  employment_type?: string;
  application_deadline?: string;
  is_published?: boolean;
  posted_date?: string;
}

interface Application {
  id: string;
  job_title: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  experience?: string;
  cover_note?: string;
  submitted_at: string;
}

interface AdminJobsProps {
  token: string;
}

export const AdminJobs: React.FC<AdminJobsProps> = ({ token }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('Mysuru, Karnataka');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [applicationDeadline, setApplicationDeadline] = useState('Open until filled');
  const [isPublished, setIsPublished] = useState(true);

  // View Applications state
  const [viewAppsJob, setViewAppsJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/owner/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingJob(null);
    setTitle('');
    setDepartment('');
    setDescription('');
    setResponsibilities('');
    setRequiredSkills('');
    setQualifications('');
    setExperience('');
    setLocation('Mysuru, Karnataka');
    setEmploymentType('Full-Time');
    setApplicationDeadline('Open until filled');
    setIsPublished(true);
    setShowModal(true);
  };

  const handleOpenEdit = (j: Job) => {
    setEditingJob(j);
    setTitle(j.title);
    setDepartment(j.department);
    setDescription(j.description);
    setResponsibilities(j.responsibilities || '');
    setRequiredSkills(j.required_skills || '');
    setQualifications(j.qualifications || '');
    setExperience(j.experience || '');
    setLocation(j.location || 'Mysuru, Karnataka');
    setEmploymentType(j.employment_type || 'Full-Time');
    setApplicationDeadline(j.application_deadline || 'Open until filled');
    setIsPublished(j.is_published !== undefined ? j.is_published : true);
    setShowModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const jobId = editingJob ? (editingJob.id || editingJob._id) : null;
    const url = jobId
      ? `http://localhost:5000/api/owner/jobs/${jobId}`
      : 'http://localhost:5000/api/owner/jobs';
    const method = jobId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          department,
          description,
          responsibilities,
          required_skills: requiredSkills,
          qualifications,
          experience,
          location,
          employment_type: employmentType,
          application_deadline: applicationDeadline,
          is_published: isPublished
        })
      });

      if (res.ok) {
        setShowModal(false);
        fetchJobs();
      } else {
        const err = await res.json();
        alert(err.message || 'Error saving job opening.');
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  const handleTogglePublish = async (j: Job) => {
    const jobId = j.id || j._id;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/jobs/${jobId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: !j.is_published })
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job opening?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleViewApplications = async (j: Job) => {
    setViewAppsJob(j);
    setAppsLoading(true);
    const jobId = j.id || j._id;
    try {
      const res = await fetch(`http://localhost:5000/api/owner/jobs/${jobId}/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center border-b border-brand-maroon/20 pb-4">
        <div>
          <h2 className="text-2xl font-serif text-white">JOB OFFERINGS MANAGEMENT</h2>
          <p className="text-xs text-zinc-400">Post career opportunities and view applicant submissions.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Job Offering
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500 uppercase tracking-widest">Loading job listings...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-10 text-center text-xs text-zinc-400">
          No job openings created yet. Click "Create Job Offering" to post a position.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(j => {
            const jobId = j.id || j._id || '';
            return (
              <div key={jobId} className="bg-brand-panelBg border border-brand-maroon/20 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      {j.department}
                    </span>
                    <h3 className="text-lg font-serif text-white font-bold uppercase mt-1">{j.title}</h3>
                  </div>

                  <button
                    onClick={() => handleTogglePublish(j)}
                    className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer ${
                      j.is_published
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {j.is_published ? 'Published' : 'Unpublished'}
                  </button>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2">{j.description}</p>

                <div className="text-[10px] text-zinc-400 space-y-1 bg-brand-darkBg/60 p-3 rounded-xl border border-white/5">
                  <div><strong>Deadline:</strong> {j.application_deadline || 'Open'}</div>
                  <div><strong>Location:</strong> {j.location || 'Mysuru'}</div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleViewApplications(j)}
                    className="flex-1 py-2 bg-brand-darkBg border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> View Applicants
                  </button>

                  <button
                    onClick={() => handleOpenEdit(j)}
                    className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                  >
                    <Edit size={12} />
                  </button>

                  <button
                    onClick={() => handleDeleteJob(jobId)}
                    className="py-2 px-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9990] flex items-center justify-center p-4">
          <div className="bg-brand-panelBg border border-brand-gold/30 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-4 text-left relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>

            <h3 className="text-xl font-serif text-white uppercase font-bold">
              {editingJob ? 'Edit Job Offering' : 'Create New Job Offering'}
            </h3>

            <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Master Confectioner"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Production & Culinary"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Comprehensive job role description..."
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Required Skills</label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={e => setRequiredSkills(e.target.value)}
                  placeholder="e.g. Tempering, Stone Conching, Quality Testing"
                  className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Application Deadline</label>
                  <input
                    type="text"
                    value={applicationDeadline}
                    onChange={e => setApplicationDeadline(e.target.value)}
                    placeholder="e.g. 30th Oct 2026"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pub-check"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-brand-gold cursor-pointer"
                />
                <label htmlFor="pub-check" className="text-xs text-white font-bold cursor-pointer">
                  Publish immediately for customer job openings
                </label>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase rounded-xl shadow cursor-pointer"
                >
                  Save Job Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Applications Modal */}
      {viewAppsJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9990] flex items-center justify-center p-4">
          <div className="bg-brand-panelBg border border-brand-gold/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-4 text-left relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewAppsJob(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] text-brand-gold uppercase tracking-[0.2em] font-bold block">Submitted Applications</span>
              <h3 className="text-xl font-serif text-white uppercase font-bold mt-0.5">{viewAppsJob.title}</h3>
            </div>

            {appsLoading ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading applicants...</div>
            ) : applications.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 bg-brand-darkBg/60 rounded-2xl border border-white/5">
                No applications submitted yet for this position.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-brand-darkBg/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs text-zinc-300">
                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{app.applicant_name}</h4>
                        <p className="text-[10px] text-brand-gold font-mono">{app.applicant_email} • {app.applicant_phone}</p>
                      </div>
                      <span className="text-[9px] text-zinc-500">{new Date(app.submitted_at).toLocaleDateString()}</span>
                    </div>

                    {app.experience && (
                      <div>
                        <strong className="text-zinc-400 text-[10px] uppercase block">Experience:</strong>
                        <p className="text-zinc-200">{app.experience}</p>
                      </div>
                    )}

                    {app.cover_note && (
                      <div>
                        <strong className="text-zinc-400 text-[10px] uppercase block">Cover Note:</strong>
                        <p className="text-zinc-300 italic">{app.cover_note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setViewAppsJob(null)}
              className="w-full py-2.5 bg-zinc-800 text-white font-bold text-xs uppercase rounded-xl mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminJobs;
