import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Building2, Briefcase, ChevronDown, ChevronUp,
  Send, X, DollarSign, CheckCircle, TrendingUp, Award, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, AlertCircle, Clock,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────
const JOB_LEVEL_RANK  = { 'Entry Level': 1, 'Mid Level': 2, Senior: 3 };
const PROFICIENCY_RANK = { Beginner: 1, Intermediate: 2, Expert: 3, Professional: 4 };
const ITEMS_PER_PAGE  = 6;
const SORT_OPTIONS    = [
  { value: 'match-desc', label: 'Best Match First',    icon: Award },
  { value: 'match-asc',  label: 'Lowest Match First',  icon: TrendingUp },
  { value: 'salary-desc',label: 'Highest Salary First', icon: DollarSign },
  { value: 'salary-asc', label: 'Lowest Salary First',  icon: DollarSign },
  { value: 'title-asc',  label: 'Title A → Z',          icon: ArrowUpDown },
  { value: 'title-desc', label: 'Title Z → A',          icon: ArrowUpDown },
];

const LEVEL_STYLES = {
  'Entry Level': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'Mid Level':   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Senior:        'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 80) return { hex: '#10b981', text: 'text-emerald-400', label: 'Excellent Match' };
  if (score >= 60) return { hex: '#7c3aed', text: 'text-purple-400',  label: 'Good Match' };
  return              { hex: '#f59e0b', text: 'text-amber-400',   label: 'Fair Match' };
};

const getMatchDetails = (job, userSkills, avgProficiency) => {
  if (!userSkills.length) return { total: 0, skills: 0, experience: 0, track: 0, matched: [] };

  const jobSkills     = (Array.isArray(job.skills) ? job.skills : []).map(s => s.toLowerCase());
  const userNames     = userSkills.map(s => (s.skill_name || '').toLowerCase());
  const matched       = jobSkills.filter(s => userNames.includes(s));
  const skillScore    = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 60) : 0;
  const requiredLevel = JOB_LEVEL_RANK[job.level] || 1;
  const expScore      = avgProficiency >= requiredLevel ? 20 : avgProficiency >= requiredLevel - 1 ? 12 : 5;
  const trackScore    = matched.length >= jobSkills.length * 0.5 ? 20 : matched.length > 0 ? 10 : 0;

  return { total: skillScore + expScore + trackScore, skills: skillScore, experience: expScore, track: trackScore, matched };
};

// ────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }) => (
  <div className={`${bgClass} border border-[#2a2a5a]/40 rounded-2xl p-5 text-center transition-transform duration-200 hover:scale-[1.03]`}>
    {Icon && <Icon size={18} className={`mx-auto mb-1.5 ${colorClass} opacity-70`} />}
    <div className={`text-3xl font-black ${colorClass}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-1 tracking-wide uppercase">{label}</div>
  </div>
);

const MatchRing = ({ score, size = 96, stroke = 5 }) => {
  const { hex } = getScoreColor(score);
  const r = (size / 2) - stroke;
  const C = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a3e" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={hex}
          strokeWidth={stroke} strokeDasharray={C}
          style={{ strokeDashoffset: C - (score / 100) * C, transition: 'stroke-dashoffset .8s ease-out' }}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-white">{score}%</span>
        <span className="text-[9px] text-gray-500 uppercase tracking-widest">match</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, max, color }) => (
  <div className="h-1.5 bg-[#1a1a3e] rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all duration-700 ease-out"
      style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
  </div>
);

const SkillTag = ({ name, matched }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all ${
    matched
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }`}>
    {matched && <CheckCircle size={10} />}{name}
  </span>
);

const LevelBadge = ({ level }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
    LEVEL_STYLES[level] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  }`}>
    <Briefcase size={10} />{level}
  </span>
);

const SkillPromptBanner = ({ onNavigate }) => (
  <div className="bg-gradient-to-r from-[#7c3aed]/10 to-[#ec4899]/10 border border-[#7c3aed]/30 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
    <div className="w-10 h-10 bg-[#7c3aed]/20 rounded-xl grid place-items-center shrink-0">
      <AlertCircle size={20} className="text-[#7c3aed]" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-white mb-0.5">Add your skills for personalized matches</h4>
      <p className="text-xs text-gray-500">Set up your skill profile so we can rank jobs by how well they fit you.</p>
    </div>
    <button onClick={onNavigate}
      className="px-4 py-2 bg-[#7c3aed] rounded-xl text-white text-sm font-semibold hover:bg-[#6d28d9] transition-colors cursor-pointer whitespace-nowrap">
      Add Skills
    </button>
  </div>
);

const ScrollToTopButton = ({ visible, onClick }) => (
  <button onClick={onClick}
    className={`fixed bottom-8 right-8 z-40 w-11 h-11 grid place-items-center rounded-full bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 transition-all duration-300 cursor-pointer hover:bg-[#6d28d9] hover:scale-110 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
    <ArrowUp size={18} />
  </button>
);

// ────────────────────────────────────────────────────────────
// DETAIL MODAL
// ────────────────────────────────────────────────────────────
const JobModal = ({ job, details, onClose }) => {
  if (!job) return null;
  const { hex, label } = getScoreColor(details.total);
  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111128] border border-[#2a2a5a]/80 rounded-3xl shadow-2xl animate-[modalIn_.25s_ease-out]">
        <div className="h-1.5 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#8b5cf6] rounded-t-3xl" />
        <button onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 grid place-items-center rounded-xl bg-[#1a1a3e] border border-[#2a2a5a] text-gray-400 hover:text-white hover:border-[#7c3aed]/50 transition-all cursor-pointer z-10">
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Title row */}
          <div className="flex items-start gap-5">
            <MatchRing score={details.total} size={110} stroke={6} />
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-2xl font-extrabold text-white leading-tight mb-1.5">{job.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1.5"><Building2 size={14} />{job.company}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} />{job.level}</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                details.total >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : details.total >= 60 ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                {label}
              </span>
            </div>
          </div>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
              <DollarSign size={18} className="text-emerald-400" />
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Salary Range</div>
                <div className="text-base font-bold text-emerald-400">
                  ৳{job.salary_min?.toLocaleString()} — ৳{job.salary_max?.toLocaleString()}
                  <span className="text-emerald-400/60 font-normal text-sm"> / month</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <ChevronRight size={14} className="text-[#7c3aed]" /> Description
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed pl-5">{job.description}</p>
            </div>
          )}

          {/* Skills */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award size={14} className="text-[#ec4899]" /> Required Skills
              <span className="text-xs font-normal text-gray-500 ml-auto">{details.matched.length}/{skills.length} matched</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <SkillTag key={i} name={s} matched={details.matched.includes(s.toLowerCase())} />
              ))}
            </div>
          </div>

          {/* Match breakdown */}
          <div className="bg-[#0a0a1a]/60 border border-[#2a2a5a]/40 rounded-xl p-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#8b5cf6]" /> Match Breakdown
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Skills', v: details.skills, max: 60, color: '#7c3aed', desc: `${details.matched.length} of ${skills.length} required skills` },
                { label: 'Experience', v: details.experience, max: 20, color: '#ec4899', desc: details.experience >= 20 ? 'Meets required level' : 'Below required level' },
                { label: 'Career Track', v: details.track, max: 20, color: '#8b5cf6', desc: details.track >= 20 ? 'Same track' : details.track >= 10 ? 'Related track' : 'Different track' },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">{b.label}</span>
                    <span className="font-bold" style={{ color: b.color }}>{b.v}/{b.max}</span>
                  </div>
                  <ProgressBar value={b.v} max={b.max} color={b.color} />
                  <p className="text-[11px] text-gray-500 mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] rounded-xl text-white text-sm font-bold hover:shadow-lg hover:shadow-[#7c3aed]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
              <Send size={16} /> Apply Now
            </button>
            <button onClick={onClose}
              className="px-6 py-3 border border-[#2a2a5a] rounded-xl text-gray-400 text-sm font-medium hover:border-[#7c3aed]/40 hover:text-white transition-all cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs]               = useState([]);
  const [userSkills, setUserSkills]   = useState([]);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState('match-desc');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  // ── Data fetch ──
  useEffect(() => {
    (async () => {
      try {
        const [jRes, sRes] = await Promise.all([
          api.get('/jobs'),
          user ? api.get(`/user-skills?user_id=${user.id}`) : Promise.resolve({ data: [] }),
        ]);
        setJobs(Array.isArray(jRes.data) ? jRes.data : []);
        setUserSkills(Array.isArray(sRes.data) ? sRes.data : []);
      } catch (e) { console.error('Fetch error', e); }
      finally     { setLoading(false); }
    })();
  }, [user]);

  // ── Escape key to close modal ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedJob) setSelectedJob(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJob]);

  // ── Scroll-to-top visibility ──
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Derived data ──
  const avgProficiency = useMemo(() => {
    if (!userSkills.length) return 0;
    return userSkills.reduce((s, u) => s + (PROFICIENCY_RANK[u.proficiency] || 1), 0) / userSkills.length;
  }, [userSkills]);

  const allFiltered = useMemo(() => {
    const filtered = jobs.filter(job => {
      const score = getMatchDetails(job, userSkills, avgProficiency).total;
      const q = search.toLowerCase();
      const ok = (job.title || '').toLowerCase().includes(q) || (job.company || '').toLowerCase().includes(q);
      if (!ok) return false;
      if (filter === 'excellent') return score >= 80;
      if (filter === 'good')      return score >= 60 && score < 80;
      if (filter === 'fair')      return score < 60;
      return true;
    });

    // ── Sorting ──
    return [...filtered].sort((a, b) => {
      const scoreA = getMatchDetails(a, userSkills, avgProficiency).total;
      const scoreB = getMatchDetails(b, userSkills, avgProficiency).total;
      switch (sortBy) {
        case 'match-desc':  return scoreB - scoreA;
        case 'match-asc':   return scoreA - scoreB;
        case 'salary-desc': return (b.salary_max || 0) - (a.salary_max || 0);
        case 'salary-asc':  return (a.salary_min || 0) - (b.salary_min || 0);
        case 'title-asc':   return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':  return (b.title || '').localeCompare(a.title || '');
        default: return 0;
      }
    });
  }, [jobs, search, filter, sortBy, userSkills, avgProficiency]);

  const totalPages   = Math.max(1, Math.ceil(allFiltered.length / ITEMS_PER_PAGE));
  const pageJobs     = allFiltered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total:     jobs.length,
    excellent: jobs.filter(j => getMatchDetails(j, userSkills, avgProficiency).total >= 80).length,
    good:      jobs.filter(j => { const s = getMatchDetails(j, userSkills, avgProficiency).total; return s >= 60 && s < 80; }).length,
    fair:      jobs.filter(j => getMatchDetails(j, userSkills, avgProficiency).total < 60).length,
  }), [jobs, userSkills, avgProficiency]);

  const modalDetails = selectedJob ? getMatchDetails(selectedJob, userSkills, avgProficiency) : null;

  // ── Loading state ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading jobs…</p>
      </div>
    </div>
  );

  // ── Render ──
  return (
    <div ref={containerRef} className="min-h-screen pt-24 pb-16 bg-[#0a0a1a] text-gray-300">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            {user ? `Welcome back, ${user.name}` : 'Explore Opportunities'}
          </h1>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            {user ? 'Jobs ranked by how well they match your skills and experience.' : 'Browse open roles and find your next career move.'}
          </p>
        </div>

        {/* ── Search + Filter toggle ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or company…"
              className="w-full pl-11 pr-4 py-3 bg-[#111128] border border-[#2a2a5a] rounded-xl text-white placeholder-gray-600 focus:border-[#7c3aed]/50 focus:ring-1 focus:ring-[#7c3aed]/20 transition-all" />
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#111128] border border-[#2a2a5a] rounded-xl text-gray-300 hover:border-[#7c3aed]/40 transition-all cursor-pointer">
            Filters {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* ── Filter & Sort panel ── */}
        {filtersOpen && (
          <div className="bg-[#111128]/80 border border-[#2a2a5a]/60 rounded-2xl p-5 mb-6 animate-[fadeIn_.2s_ease-out]">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Match Level</label>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
                  className="w-full sm:w-56 bg-[#0a0a1a] border border-[#2a2a5a] rounded-xl px-4 py-2.5 text-gray-300 focus:border-[#7c3aed]/50 transition-all appearance-none cursor-pointer">
                  <option value="all">All Matches</option>
                  <option value="excellent">Excellent (80 %+)</option>
                  <option value="good">Good (60 – 79 %)</option>
                  <option value="fair">Fair (&lt; 60 %)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Sort By</label>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full sm:w-56 bg-[#0a0a1a] border border-[#2a2a5a] rounded-xl px-4 py-2.5 text-gray-300 focus:border-[#7c3aed]/50 transition-all appearance-none cursor-pointer">
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Skill prompt banner ── */}
        {user && userSkills.length === 0 && (
          <SkillPromptBanner onNavigate={() => navigate('/profile')} />
        )}

        {/* ── Stats ── */}
        {user && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Jobs" value={stats.total}     colorClass="text-[#8b5cf6]"    bgClass="bg-[#7c3aed]/10" icon={Briefcase} />
            <StatCard label="Excellent"  value={stats.excellent}  colorClass="text-emerald-400"  bgClass="bg-emerald-500/10" icon={Award} />
            <StatCard label="Good"       value={stats.good}       colorClass="text-purple-400"   bgClass="bg-purple-500/10" icon={TrendingUp} />
            <StatCard label="Fair"       value={stats.fair}       colorClass="text-amber-400"    bgClass="bg-amber-500/10" icon={Search} />
          </div>
        )}

        {/* ── Job cards ── */}
        {pageJobs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-[#111128] rounded-2xl grid place-items-center mx-auto mb-4">
              <Briefcase size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">No jobs found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
            {(search || filter !== 'all') && (
              <button onClick={() => { setSearch(''); setFilter('all'); setPage(1); }}
                className="mt-4 px-5 py-2 bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded-xl text-[#8b5cf6] text-sm font-medium hover:bg-[#7c3aed]/30 transition-all cursor-pointer">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pageJobs.map((job, idx) => {
              const d = getMatchDetails(job, userSkills, avgProficiency);
              const { label, text } = getScoreColor(d.total);
              const skills = Array.isArray(job.skills) ? job.skills : [];
              return (
                <div key={job.id}
                  className="group bg-[#111128]/80 border border-[#2a2a5a]/60 rounded-2xl p-5 sm:p-6 hover:border-[#7c3aed]/25 transition-all duration-300 hover:shadow-lg hover:shadow-[#7c3aed]/5"
                  style={{ animationDelay: `${idx * .04}s` }}>
                  <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">

                    {/* Ring */}
                    {user && (
                      <div className="flex lg:flex-col items-center gap-3 lg:justify-center lg:min-w-[110px]">
                        <MatchRing score={d.total} />
                        <span className={`text-xs font-semibold ${text} whitespace-nowrap`}>{label}</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-[#8b5cf6] transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1.5"><Building2 size={14} />{job.company}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
                        <LevelBadge level={job.level} />
                        {job.type && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#1a1a3e] rounded-md text-[11px] text-gray-400 border border-[#2a2a5a]/40">
                            <Clock size={10} />{job.type}
                          </span>
                        )}
                      </div>

                      {job.description && <p className="text-sm text-gray-400 leading-relaxed mb-3 line-clamp-2">{job.description}</p>}

                      {(job.salary_min || job.salary_max) && (
                        <p className="text-sm font-semibold text-emerald-400 mb-3">
                          ৳{job.salary_min?.toLocaleString()} — ৳{job.salary_max?.toLocaleString()}/mo
                        </p>
                      )}

                      {/* Skill tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {skills.slice(0, 6).map((s, i) => (
                          <SkillTag key={i} name={s} matched={user && d.matched.includes(s.toLowerCase())} />
                        ))}
                        {skills.length > 6 && <span className="text-xs text-gray-600 self-center">+{skills.length - 6} more</span>}
                      </div>

                      <div className="flex gap-2.5">
                        <button onClick={() => { if (!user) navigate('/login'); }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] rounded-xl text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#7c3aed]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                          <Send size={14} /> Apply Now
                        </button>
                        <button onClick={() => setSelectedJob(job)}
                          className="px-5 py-2.5 border border-[#2a2a5a] rounded-xl text-gray-400 text-sm font-medium hover:border-[#7c3aed]/40 hover:text-white transition-all cursor-pointer">
                          Details
                        </button>
                      </div>
                    </div>

                    {/* Breakdown sidebar */}
                    {user && (
                      <div className="lg:min-w-[180px] bg-[#0a0a1a]/50 border border-[#2a2a5a]/40 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-3">Breakdown</h4>
                        {[
                          { l: 'Skills',     v: d.skills,     m: 60, c: '#7c3aed' },
                          { l: 'Experience', v: d.experience, m: 20, c: '#ec4899' },
                          { l: 'Track',      v: d.track,      m: 20, c: '#8b5cf6' },
                        ].map(b => (
                          <div key={b.l} className="mb-2.5 last:mb-0">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-gray-500">{b.l}</span>
                              <span className="text-gray-300 font-medium">{b.v}/{b.m}</span>
                            </div>
                            <ProgressBar value={b.v} max={b.m} color={b.c} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Results summary ── */}
        {allFiltered.length > 0 && (
          <div className="flex items-center justify-between mt-8 mb-2 px-1">
            <p className="text-xs text-gray-600">
              Showing <span className="text-gray-400 font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, allFiltered.length)}</span> of{' '}
              <span className="text-gray-400 font-medium">{allFiltered.length}</span> results
            </p>
            <p className="text-xs text-gray-600">
              Sorted by <span className="text-[#8b5cf6] font-medium">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
            </p>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#111128] border border-[#2a2a5a] rounded-xl text-sm text-gray-400 hover:text-white hover:border-[#7c3aed]/40 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
              <ChevronLeft size={15} /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 grid place-items-center rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    p === page
                      ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                      : 'bg-[#111128] border border-[#2a2a5a] text-gray-500 hover:text-white hover:border-[#7c3aed]/40'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#111128] border border-[#2a2a5a] rounded-xl text-sm text-gray-400 hover:text-white hover:border-[#7c3aed]/40 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <JobModal job={selectedJob} details={modalDetails} onClose={() => setSelectedJob(null)} />

      {/* ── Scroll to top ── */}
      <ScrollToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}