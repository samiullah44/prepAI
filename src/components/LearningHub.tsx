import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Briefcase, Users, TrendingUp, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_url: string;
}

const categoryIcons: Record<string, JSX.Element> = {
  Behavioral: <Users className="w-6 h-6" />,
  Technical: <Code className="w-6 h-6" />,
  HR: <Briefcase className="w-6 h-6" />,
  'Soft Skills': <Star className="w-6 h-6" />,
  Career: <TrendingUp className="w-6 h-6" />
};

const categoryColors: Record<string, string> = {
  Behavioral: 'from-purple-500 to-purple-600',
  Technical: 'from-cyan-500 to-cyan-600',
  HR: 'from-amber-500 to-amber-600',
  'Soft Skills': 'from-green-500 to-green-600',
  Career: 'from-orange-500 to-orange-600'
};

export default function LearningHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    const { data } = await supabase
      .from('learning_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setResources(data);
    }
  }

  const categories = ['All', ...new Set(resources.map((r) => r.category))];

  const filteredResources =
    selectedCategory === 'All'
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8 text-cyan-600" />
          <h1 className="text-4xl font-bold text-gray-900">Learning Hub</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Curated resources to help you ace your interviews
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-200 cursor-pointer"
          >
            <div
              className={`w-14 h-14 bg-gradient-to-r ${
                categoryColors[resource.category] || 'from-gray-500 to-gray-600'
              } rounded-xl flex items-center justify-center text-white mb-4`}
            >
              {categoryIcons[resource.category] || <BookOpen className="w-6 h-6" />}
            </div>

            <div className="mb-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  resource.category === 'Technical'
                    ? 'bg-cyan-100 text-cyan-700'
                    : resource.category === 'Behavioral'
                    ? 'bg-purple-100 text-purple-700'
                    : resource.category === 'HR'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {resource.category}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{resource.description}</p>

            <motion.button
              whileHover={{ x: 5 }}
              className="text-cyan-600 font-semibold text-sm flex items-center space-x-2"
            >
              <span>Learn More</span>
              <span>→</span>
            </motion.button>
          </motion.div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-600 text-lg">No resources found in this category</p>
        </motion.div>
      )}
    </div>
  );
}
