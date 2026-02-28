import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../utils/api';

export default function Resources() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-black mb-3">Learning Resources</h1>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#f1f1f1] border border-gray-300 rounded-xl text-black placeholder-gray-600"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-24">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-24">No courses found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <h3 className="text-xl font-bold">{course.name}</h3>
              <p className="text-gray-500 text-sm">{course.description || 'No description available'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}