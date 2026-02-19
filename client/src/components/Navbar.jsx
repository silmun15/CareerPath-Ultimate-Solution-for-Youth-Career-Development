import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell, ChevronDown, Sparkles, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/jobs', label: 'Jobs' },
        { to: '/resources', label: 'Resources' },
        { to: '/contact', label: 'Contact' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/jobs', label: 'Jobs' },
        { to: '/resources', label: 'Resources' },
        { to: '/contact', label: 'Contact' },
      ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a1a]/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-[#2a2a5a]/50'
          : 'bg-[#0a0a1a]/70 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#7c3aed]/20 group-hover:shadow-[#7c3aed]/40 transition-shadow duration-300">
              C
            </div>
            <span className="text-xl font-bold gradient-text">CareerPath</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-white bg-[#7c3aed]/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#8b5cf6] rounded-full" />
                )}
              </Link>
            ))}
            {user && (
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
                  <Sparkles size={14} className="text-[#8b5cf6]" />
                  AI Tools
                  <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-52 bg-[#111128]/95 backdrop-blur-xl border border-[#2a2a5a] rounded-xl shadow-2xl shadow-black/40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 overflow-hidden">
                  <Link to="/jobs" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#7c3aed]/10 transition-colors duration-150">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                    AI Job Matching
                  </Link>
                  <Link to="/resources" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#7c3aed]/10 transition-colors duration-150">
                    <span className="w-2 h-2 rounded-full bg-[#ec4899]" />
                    Course Recommender
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
                  <Bell size={19} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ec4899] rounded-full ring-2 ring-[#0a0a1a]" />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-200 ${
                      userMenuOpen
                        ? 'bg-[#7c3aed]/10 border-[#7c3aed]/40'
                        : 'bg-[#1a1a3e]/50 border-[#2a2a5a] hover:border-[#7c3aed]/30'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-200 max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-52 bg-[#111128]/95 backdrop-blur-xl border border-[#2a2a5a] rounded-xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-200 ${
                      userMenuOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible translate-y-1'
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-[#2a2a5a]">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#7c3aed]/10 transition-colors duration-150"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold bg-linear-to-r from-[#7c3aed] to-[#6d28d9] rounded-full text-white shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40 hover:scale-[1.02] transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[500px] border-t border-[#2a2a5a]' : 'max-h-0'
        }`}
      >
        <div className="bg-[#111128]/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-white bg-[#7c3aed]/15'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-3 mt-3 border-t border-[#2a2a5a] space-y-2">
              <Link to="/login" className="block px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/register" className="block px-4 py-3 rounded-xl text-sm bg-[#7c3aed] text-white text-center font-semibold">
                Get Started
              </Link>
            </div>
          )}
          {user && (
            <div className="pt-3 mt-3 border-t border-[#2a2a5a]">
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
