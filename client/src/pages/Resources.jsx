import { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  X,
  Star,
  Layers,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import api from '../utils/api';

/* -------------------- Static Images -------------------- */
const courseImages = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
];

/* -------------------- Component -------------------- */
export default function Resources() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  /* -------------------- Fetch Courses -------------------- */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Search Filter -------------------- */
  const filteredCourses = courses.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0b0b1a]">
      <div className="max-w-6xl mx-auto px-6">

        {/* ================= Header ================= */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Learning Resources
          </h1>
          <p className="text-gray-400">
            Explore courses and build skills for your future career
          </p>
        </div>

        {/* ================= Search ================= */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#111128] border border-[#2a2a5a] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* ================= Content ================= */}
        {loading ? (
          <div className="text-center py-24 text-gray-400">
            Loading courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            No courses found
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const img = courseImages[index % courseImages.length];

              return (
                <div
                  key={course.id}
                  className="bg-[#111128] border border-[#2a2a5a] rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all"
                >
                  {/* Image */}
                  <div className="h-40 overflow-hidden">
                    <img
                      src={img}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {course.name}
                    </h3>

                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                      <span className="flex items-center gap-1">
                        <Users size={13} /> 120+
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> Self-paced
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-white text-sm font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= Modal ================= */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCourse(null)}
        >
          <div className="absolute inset-0 bg-black/70" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#111128] border border-[#2a2a5a] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Close */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-[#2a2a5a]">
              <h2 className="text-2xl font-extrabold text-white mb-2">
                {selectedCourse.name}
              </h2>
              <p className="text-gray-400 text-sm">
                {selectedCourse.description || 'No description available'}
              </p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-purple-400" />
                  Certificate
                </span>
                <span className="flex items-center gap-2">
                  <Layers size={16} className="text-pink-400" />
                  All Levels
                </span>
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" />
                  4.8 Rating
                </span>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-white font-bold mb-2">
                  <ChevronRight size={16} className="text-purple-400" />
                  What you'll learn
                </h4>
                <ul className="text-sm text-gray-400 list-disc pl-6 space-y-1">
                  <li>Core fundamentals</li>
                  <li>Practical examples</li>
                  <li>Industry best practices</li>
                  <li>Career-ready skills</li>
                </ul>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="w-full py-3 border border-[#2a2a5a] rounded-xl text-gray-400 hover:text-white hover:border-purple-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}