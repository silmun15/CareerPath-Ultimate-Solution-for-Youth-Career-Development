import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, Users, CheckCircle, Clock, Star } from 'lucide-react';
import api from '../utils/api';

const courseImages = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
];

const topicColors = {
  'AI': 'bg-purple-500/15 text-purple-400',
  'Web': 'bg-blue-500/15 text-blue-400',
  'Data': 'bg-emerald-500/15 text-emerald-400',
  'Mobile': 'bg-pink-500/15 text-pink-400',
  'Cloud': 'bg-cyan-500/15 text-cyan-400',
  'default': 'bg-[#7c3aed]/15 text-[#8b5cf6]',
};

function getTopicColor(topic) {
  const key = Object.keys(topicColors).find(k => (topic || '').toLowerCase().includes(k.toLowerCase()));
  return topicColors[key] || topicColors['default'];
}

export default function Resources() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        api.get('/courses'),
        user ? api.get(`/enrollments?user_id=${user.id}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId) => enrollments.some((en) => en.course_id === courseId);

  const handleEnroll = async (courseId) => {
    if (!user) return alert('Please login to enroll');
    setActionLoading(courseId);
    try {
      await api.post('/enrollments', { course_id: courseId, user_id: user.id });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    setActionLoading(courseId);
    try {
      const enrollment = enrollments.find((en) => en.course_id === courseId);
      if (enrollment) {
        await api.delete(`/enrollments/${enrollment.id}`);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCourses = courses.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.topic || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16 page-enter">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Learning Resources</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Explore and enroll in courses to build skills for your dream career
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by name, topic, or description..."
              className="w-full pl-11 pr-4 py-3.5 bg-[#111128] border border-[#2a2a5a] rounded-xl text-white placeholder-gray-600 focus:border-[#7c3aed]/50 focus:ring-1 focus:ring-[#7c3aed]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* User indicator */}
        {user && (
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-full text-sm text-[#8b5cf6]">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Signed in as <span className="text-[#ec4899] font-medium">{user.email}</span>
            </span>
          </div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-10 h-10 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-[#111128] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">No courses found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredCourses.map((course, index) => {
              const enrolled = isEnrolled(course.id);
              const img = courseImages[index % courseImages.length];
              const tc = getTopicColor(course.topic);

              return (
                <div
                  key={course.id}
                  className="group bg-[#111128]/80 border border-[#2a2a5a]/60 rounded-2xl overflow-hidden hover:border-[#7c3aed]/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7c3aed]/5"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={img}
                      alt={course.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#111128] via-[#111128]/20 to-transparent" />
                    {enrolled && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold shadow-lg">
                        <CheckCircle size={12} /> Enrolled
                      </div>
                    )}
                    {course.topic && (
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${tc}`}>
                        {course.topic}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#8b5cf6] transition-colors duration-200 line-clamp-1">
                      {course.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                      {course.description || course.topic || 'Learn essential skills in this comprehensive course.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} />
                        {course.enrollment_count || 0} enrolled
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        Self-paced
                      </span>
                    </div>

                    <div className="flex gap-2.5">
                      <button className="flex-1 py-2.5 border border-[#2a2a5a] rounded-xl text-gray-400 text-sm font-medium hover:border-[#7c3aed]/40 hover:text-white transition-all duration-200">
                        View Details
                      </button>
                      {enrolled ? (
                        <button
                          onClick={() => handleUnenroll(course.id)}
                          disabled={actionLoading === course.id}
                          className="flex-1 py-2.5 bg-[#ec4899] hover:bg-[#db2777] rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                        >
                          {actionLoading === course.id ? 'Processing...' : 'Unenroll'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={actionLoading === course.id}
                          className="flex-1 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/30 disabled:opacity-50"
                        >
                          {actionLoading === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
