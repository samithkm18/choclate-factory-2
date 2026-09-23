import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, Calendar, CheckCircle2, Send, AlertCircle, FileText } from 'lucide-react';

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
  posted_date?: string;
  application_deadline?: string;
  is_published?: boolean;
}

export const JobOpenings: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Application Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs');
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
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!name || !email || !phone) {
      setErrorMessage('Please fill in your name, email, and phone number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const jobId = selectedJob.id || selectedJob._id;
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_name: name,
          applicant_email: email,
          applicant_phone: phone,
          experience,
          cover_note: coverNote
        })
      });

      if (res.ok) {
        setAppliedSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setExperience('');
        setCoverNote('');
      } else {
        const data = await res.json();
        setErrorMessage(data.message || 'Could not submit application.');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-24 px-4 sm:px-6 md:px-12 font-sans overflow-x-hidden text-left">
      
      {/* Header */}
      <div className="border-b border-brand-maroon/20 pb-6 mb-8">
        <span className="text-[10px] text-brand-gold uppercase tracking-[0.3em] font-extrabold block">
          Careers at Kote Factory
        </span>
        <h1 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-wider font-bold mt-1">
          Job Openings
        </h1>
        <p className="text-xs text-zinc-400 mt-2 max-w-xl">
          Join our passionate team of artisanal confectioners, master chocolatiers, and culinary innovators in Mysuru.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Discovering Career Opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-8 space-y-3">
          <Briefcase size={40} className="text-zinc-600 mx-auto" />
          <h3 className="text-lg font-serif text-zinc-300 uppercase">No Active Openings</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            We currently don't have open positions. Check back soon or follow our social channels for updates!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const jobId = job.id || job._id || '';
            return (
              <div
                key={jobId}
                className="bg-brand-panelBg border border-brand-maroon/20 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-brand-gold/30 transition-all shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-3 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                      {job.department}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Deadline: {job.application_deadline || 'Open'}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif text-white font-bold uppercase">{job.title}</h3>

                  <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-gold" /> {job.location || 'Mysuru'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-brand-gold" /> {job.employment_type || 'Full-Time'}</span>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed pt-2 border-t border-white/5">
                    {job.description}
                  </p>

                  {job.required_skills && (
                    <div className="text-[10px] text-zinc-400 bg-brand-darkBg/60 p-2.5 rounded-xl border border-white/5">
                      <strong className="text-brand-gold block uppercase tracking-wider text-[9px] mb-0.5">Required Skills:</strong>
                      {job.required_skills}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setAppliedSuccess(false);
                      setErrorMessage('');
                    }}
                    className="w-full py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Apply for Position
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9990] flex items-center justify-center p-4">
          <div className="bg-brand-panelBg border border-brand-gold/30 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 text-left relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] text-brand-gold uppercase tracking-[0.2em] font-bold block">Job Application</span>
              <h3 className="text-xl font-serif text-white font-bold uppercase mt-1">{selectedJob.title}</h3>
              <p className="text-xs text-zinc-400">{selectedJob.department} • {selectedJob.location || 'Mysuru'}</p>
            </div>

            {appliedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <h4 className="text-lg font-serif text-brand-gold uppercase font-bold">Application Submitted!</h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                  Thank you for applying. Our talent recruitment team will review your application and contact you soon.
                </p>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-6 py-2.5 bg-brand-gold text-brand-maroonDark font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={14} /> {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ananya@example.com"
                      className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Years of Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3 years in confectionery production"
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Cover Note / Summary</label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly introduce yourself and why you'd like to join Kote Factory..."
                    className="w-full bg-brand-darkBg border border-brand-gold/25 focus:border-brand-gold rounded-lg px-3.5 py-2.5 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-brand-gold hover:bg-brand-goldDark text-brand-maroonDark font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default JobOpenings;
