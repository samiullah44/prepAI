import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Star, Zap, Target, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  icon: string;
  earned_at: string;
}

const achievementIcons: Record<string, JSX.Element> = {
  trophy: <Trophy className="w-8 h-8" />,
  star: <Star className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
  target: <Target className="w-8 h-8" />,
  flame: <Flame className="w-8 h-8" />,
  award: <Award className="w-8 h-8" />
};

const achievementColors: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-600',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-amber-500 to-amber-600',
  platinum: 'from-cyan-400 to-cyan-600'
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user!.id)
      .order('earned_at', { ascending: false });

    if (data) {
      setAchievements(data);
    }

    if (data && data.length === 0) {
      await createWelcomeAchievement();
    }

    setLoading(false);
  }

  async function createWelcomeAchievement() {
    const welcomeAchievement = {
      user_id: user!.id,
      achievement_type: 'bronze',
      achievement_name: 'Welcome to PrepAI',
      description: 'Started your interview preparation journey',
      icon: 'star'
    };

    const { data } = await supabase
      .from('user_achievements')
      .insert(welcomeAchievement)
      .select()
      .single();

    if (data) {
      setAchievements([data]);
    }
  }

  const availableAchievements = [
    {
      name: 'First Interview',
      description: 'Complete your first mock interview',
      icon: 'target',
      type: 'bronze',
      locked: !achievements.some(a => a.achievement_name === 'First Interview')
    },
    {
      name: 'Perfect Score',
      description: 'Score 100% in an interview',
      icon: 'trophy',
      type: 'gold',
      locked: true
    },
    {
      name: 'Interview Master',
      description: 'Complete 10 mock interviews',
      icon: 'zap',
      type: 'silver',
      locked: true
    },
    {
      name: 'Week Warrior',
      description: 'Practice 7 days in a row',
      icon: 'flame',
      type: 'platinum',
      locked: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-5xl"
        >
          🏆
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-8 h-8 text-cyan-600" />
          <h1 className="text-4xl font-bold text-gray-900">Achievements</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Track your progress and unlock new badges
        </p>
      </motion.div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Earned Achievements</h2>
        {achievements.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${
                    achievementColors[achievement.achievement_type] || 'from-gray-500 to-gray-600'
                  } rounded-full flex items-center justify-center text-white mb-4`}
                >
                  {achievementIcons[achievement.icon] || <Award className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {achievement.achievement_name}
                </h3>
                <p className="text-gray-600 mb-3">{achievement.description}</p>
                <p className="text-xs text-gray-500">
                  Earned {new Date(achievement.earned_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl border border-gray-200"
          >
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-600">Start practicing to earn your first achievement!</p>
          </motion.div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Achievements</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!achievement.locked ? { y: -5 } : {}}
              className={`bg-white rounded-2xl p-6 border-2 ${
                achievement.locked
                  ? 'border-gray-200 opacity-60'
                  : 'border-cyan-200 shadow-lg'
              }`}
            >
              <div
                className={`w-14 h-14 bg-gradient-to-r ${
                  achievementColors[achievement.type]
                } rounded-full flex items-center justify-center text-white mb-4 ${
                  achievement.locked ? 'grayscale' : ''
                }`}
              >
                {achievementIcons[achievement.icon]}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {achievement.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
              {achievement.locked && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>🔒</span>
                  <span>Locked</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
