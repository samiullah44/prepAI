import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  BookOpen,
  Award,
  LogOut,
  TrendingUp,
  Target,
  Calendar,
  Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import InterviewPage from './InterviewPage';
import ResumeAnalyzer from './ResumeAnalyzer';
import LearningHub from './LearningHub';
import Achievements from './Achievements';

interface UserProgress {
  total_interviews: number;
  average_score: number;
  interviews_this_week: number;
  streak_days: number;
  total_points: number;
  total_resumes_analyzed: number;
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  async function fetchUserProgress() {
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setProgress(data);
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'interview', label: 'Mock Interview', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'resume', label: 'Resume Analyzer', icon: <FileText className="w-5 h-5" /> },
    { id: 'learning', label: 'Learning Hub', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" /> }
  ];

  function renderContent() {
    switch (currentPage) {
      case 'interview':
        return <InterviewPage />;
      case 'resume':
        return <ResumeAnalyzer />;
      case 'learning':
        return <LearningHub />;
      case 'achievements':
        return <Achievements />;
      default:
        return <DashboardHome progress={progress} onNavigate={setCurrentPage} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6 z-50">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            P
          </div>
          <span className="text-xl font-bold text-gray-900">PrepAI</span>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-gradient-to-br from-cyan-50 to-gray-50 rounded-xl mb-4">
            <p className="text-sm font-medium text-gray-900 mb-1">{profile?.full_name}</p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signOut()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </motion.button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
}

interface DashboardHomeProps {
  progress: UserProgress | null;
  onNavigate: (page: string) => void;
}

function DashboardHome({ progress, onNavigate }: DashboardHomeProps) {
  const stats = [
    {
      label: 'Total Points',
      value: progress?.total_points || 0,
      icon: <Award className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      highlight: true
    },
    {
      label: 'Total Interviews',
      value: progress?.total_interviews || 0,
      icon: <Target className="w-6 h-6" />,
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      label: 'Average Score',
      value: `${Math.round(progress?.average_score || 0)}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-amber-500 to-amber-600'
    },
    {
      label: 'Resumes Analyzed',
      value: progress?.total_resumes_analyzed || 0,
      icon: <FileText className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'This Week',
      value: progress?.interviews_this_week || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Streak Days',
      value: progress?.streak_days || 0,
      icon: <Flame className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const quickActions = [
    {
      title: 'Start Mock Interview',
      description: 'Practice with AI-powered questions',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-cyan-500 to-cyan-600',
      action: () => onNavigate('interview')
    },
    {
      title: 'Analyze Resume',
      description: 'Get AI feedback on your resume',
      icon: <FileText className="w-8 h-8" />,
      color: 'from-amber-500 to-amber-600',
      action: () => onNavigate('resume')
    },
    {
      title: 'Learning Resources',
      description: 'Browse curated interview tips',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      action: () => onNavigate('learning')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome Back! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to ace your next interview? Let's get started.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className={`bg-white rounded-2xl p-6 border-2 hover:shadow-lg transition-shadow ${
              stat.highlight ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-white' : 'border-gray-200'
            }`}
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white mb-4`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={action.action}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all text-left"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                {action.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
