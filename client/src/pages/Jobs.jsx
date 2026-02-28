import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Building2, Briefcase, TrendingUp, Send, 
  X, DollarSign, Star, CheckCircle, Clock, Award, ChevronRight 
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// --- CONSTANTS & UTILS ---
const SKILL_COLORS = [
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
];

const PROFICIENCY_RANK = { Beginner: 1, Intermediate: 2, Expert: 3, Professional: 4 };
const JOB_LEVEL_RANK = { 'Entry Level': 1, 'Mid Level': 2, Senior: 3 };

/**
 * INTERMEDIATE CONCEPT: Logic Encapsulation
 * Keeping the "Math" separate from the "View"
 */
const MatchEngine = {
  calculate: (job, userSkills, avgProficiency) => {
    if (!userSkills.length) return { total: 0, skills: 0, experience: 0, track: 0, matchedSkills: [] };

    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    const userSkillNames = userSkills.map(s => s.skill_name.toLowerCase());

    // 1. Skill Match (60 pts)
    const matchedSkills = jobSkills.filter(js => userSkillNames.includes(js));
    const skillScore = jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 60) : 0;

    // 2. Experience Match (20 pts)
    const requiredLevel = JOB_LEVEL_RANK[job.level] || 1;
    let expScore = avgProficiency >= requiredLevel ? 20 : (requiredLevel - avgProficiency <= 1 ? 12 : 5);

    // 3. Track Match (20 pts)
    const trackScore = matchedSkills.length > 0 ? (matchedSkills.length >= jobSkills.length * 0.5 ? 20 : 10) : 0;

    return { total: skillScore + expScore + trackScore, skills: skillScore, experience: expScore, track: trackScore, matchedSkills };
  },

  getLabel: (score) => {
    if (score >= 80) return { text: 'Excellent Match', color: 'text-emerald-400', hex: '#10b981' };
    if (score >= 60) return { text: 'Good Match', color: 'text-purple-400', hex: '#7c3aed' };
    return { text: 'Fair Match', color: 'text-amber-400', hex: '#f59e0b' };
  }
};

// --- SUB-COMPONENTS (For Readability) ---

const StatCard = ({ label, value, colorClass, bgClass }) => (
  <div className={`${bgClass} border border-[#2a2a5a]/40 rounded-xl p-4 text-center`}>
    <div className={`text-2xl font-extrabold ${colorClass}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

const MatchRing = ({ score, size = 100, stroke = 5 }) => {
  const { hex } = MatchEngine.getLabel(score);
  const radius = (size / 2) - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1a3e" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={hex}
          strokeWidth={stroke} strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s ease-out' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
        {score}%
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsRes, skillsRes] = await Promise.all([
          api.get('/jobs'),
          user ? api.get(`/user-skills?user_id=${user.id}`) : Promise.resolve({ data: [] })
        ]);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
        setUserSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
      } catch (e) {
        console.error("Data fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Intermediate Concept: Derived State (Memoization)
  const avgProficiency = useMemo(() => {
    if (!userSkills.length) return 0;
    return userSkills.reduce((sum, s) => sum + (PROFICIENCY_RANK[s.proficiency] || 1), 0) / userSkills.length;
  }, [userSkills]);

  const avgLevelLabel = useMemo(() => {
    if (avgProficiency >= 3.5) return 'Professional';
    if (avgProficiency >= 2.5) return 'Expert';
    if (avgProficiency >= 1.5) return 'Intermediate';
    return avgProficiency > 0 ? 'Beginner' : 'N/A';
  }, [avgProficiency]);

  // Pre-calculating matches and filtering in one pass
  const processedJobs = useMemo(() => {
    return jobs
      .map(job => ({
        ...job,
        matchDetails: MatchEngine.calculate(job, userSkills, avgProficiency)
      }))
      .filter(job => {
        const query = search.toLowerCase();
        const matchesSearch = job.title?.toLowerCase().includes(query) || job.company?.toLowerCase().includes(query);
        const score = job.matchDetails.total;

        if (!matchesSearch) return false;
        if (filter === 'excellent') return score >= 80;
        if (filter === 'good') return score >= 60 && score < 80;
        if (filter === 'fair') return score < 60;
        return true;
      });
  }, [jobs, userSkills, avgProficiency, search, filter]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: jobs.length,
    excellent: jobs.filter(j => MatchEngine.calculate(j, userSkills, avgProficiency).total >= 80).length,
    good: jobs.filter(j => {
      const s = MatchEngine.calculate(j, userSkills, avgProficiency).total;
      return s >= 60 && s < 80;
    }).length
  }), [jobs, userSkills, avgProficiency]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] text-white">Loading...</div>;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0a1a] text-gray-300">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3">
            {user ? `Welcome, ${user.name}` : 'Explore Roles'}
          </h1>
          <div className="flex justify-center gap-3">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">{avgLevelLabel} Level</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">{userSkills.length} Skills Linked</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              className="w-full bg-[#111128] border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-purple-500 outline-none transition-all"
              placeholder="Search by title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="bg-[#111128] border border-white/10 rounded-xl px-4 py-3 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Match Levels</option>
            <option value="excellent">Excellent Matches (80%+)</option>
            <option value="good">Good Matches (60-79%)</option>
            <option value="fair">Fair Matches (Under 60%)</option>
          </select>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Jobs" value={stats.total} colorClass="text-white" bgClass="bg-white/5" />
          <StatCard label="Excellent" value={stats.excellent} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
          <StatCard label="Good" value={stats.good} colorClass="text-purple-400" bgClass="bg-purple-500/10" />
          <StatCard label="Remaining" value={stats.total - stats.excellent - stats.good} colorClass="text-amber-400" bgClass="bg-amber-500/10" />
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {processedJobs.map((job) => {
            const { total, matchedSkills } = job.matchDetails;
            const label = MatchEngine.getLabel(total);

            return (
              <div 
                key={job.id}
                className="group bg-[#111128] border border-white/5 p-6 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <MatchRing score={total} size={80} />
                  
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Building2 size={14}/> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                      <span className="flex items-center gap-1"><Briefcase size={14}/> {job.level}</span>
                    </div>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                      {job.skills?.slice(0, 4).map(s => (
                        <span key={s} className={`text-[10px] px-2 py-1 rounded-md border ${matchedSkills.includes(s.toLowerCase()) ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 text-gray-500'}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${label.color}`}>{label.text}</span>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal - Simplified logic for one file */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
          <div className="bg-[#111128] border border-white/10 w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <MatchRing score={selectedJob.matchDetails.total} size={110} stroke={6} />
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-white/5 rounded-full"><X/></button>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2">{selectedJob.title}</h2>
            <p className="text-purple-400 font-bold mb-6">{selectedJob.company} • {selectedJob.location}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs uppercase mb-1">Salary</div>
                <div className="text-emerald-400 font-bold">৳{selectedJob.salary_min} - ৳{selectedJob.salary_max}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs uppercase mb-1">Role Type</div>
                <div className="text-white font-bold">{selectedJob.level}</div>
              </div>
            </div>

            <h4 className="font-bold text-white mb-3">Job Description</h4>
            <p className="text-sm leading-relaxed text-gray-400 mb-8">{selectedJob.description}</p>

            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold text-white hover:opacity-90 transition-all">
              Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}