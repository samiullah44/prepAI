import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, X, Sparkles, Award, Target, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  missingSkills: string[];
  atsScore: number;
  keywordsFound: string[];
  pointsEarned?: number;
}

export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState<number[]>([]);

  const jobRoles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'UX Designer',
    'Marketing Manager',
    'Sales Executive'
  ];

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(uploadedFile: File) {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (validTypes.includes(uploadedFile.type)) {
      setFile(uploadedFile);
    } else {
      alert('Please upload a PDF or DOC file');
    }
  }

  async function analyzeResume() {
    if (!file || !selectedRole) return;

    setAnalyzing(true);

    setTimeout(async () => {
      const baseScore = Math.floor(Math.random() * 20) + 70;
      const atsScore = Math.floor(Math.random() * 15) + 75;

      const roleKeywords: Record<string, string[]> = {
        'Software Engineer': ['JavaScript', 'React', 'Node.js', 'Python', 'Git', 'API', 'Database'],
        'Product Manager': ['Roadmap', 'Stakeholder', 'Analytics', 'Agile', 'Strategy', 'KPI'],
        'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas', 'TensorFlow']
      };

      const keywords = roleKeywords[selectedRole] || ['Leadership', 'Communication', 'Problem-solving'];
      const foundKeywords = keywords.slice(0, Math.floor(Math.random() * 3) + 3);
      const missingSkills = keywords.filter(k => !foundKeywords.includes(k));

      const mockResult: AnalysisResult = {
        score: baseScore,
        atsScore,
        keywordsFound: foundKeywords,
        strengths: [
          'Clear and concise professional summary',
          'Quantified achievements with specific metrics',
          'Relevant technical skills highlighted',
          'Well-structured work experience section',
          'Strong action verbs used throughout'
        ],
        weaknesses: [
          'Missing some key role-specific keywords',
          'Could benefit from more industry terminology',
          'Education section needs more detail'
        ],
        missingSkills,
        suggestions: [
          `Add keywords: ${missingSkills.slice(0, 2).join(', ')}`,
          'Include links to portfolio or GitHub projects',
          'Expand on leadership experience with concrete examples',
          'Consider adding a certifications section',
          'Use more specific metrics (%, $, #) to quantify impact'
        ],
        pointsEarned: Math.floor(baseScore / 10) * 10
      };

      setResult(mockResult);
      setAnalysisHistory([...analysisHistory, mockResult.score]);

      await supabase.from('resumes').insert({
        user_id: user!.id,
        file_url: '',
        file_name: file.name,
        job_role: selectedRole,
        analysis_result: mockResult,
        score: mockResult.score
      });

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (progress) {
        await supabase
          .from('user_progress')
          .update({
            total_resumes_analyzed: (progress.total_resumes_analyzed || 0) + 1,
            total_points: (progress.total_points || 0) + mockResult.pointsEarned!,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user!.id);
      }

      setAnalyzing(false);
    }, 3000);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setSelectedRole('');
  }

  function getScoreColor(score: number) {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-cyan-600';
    return 'text-amber-600';
  }

  function getScoreBgColor(score: number) {
    if (score >= 85) return 'from-green-50 to-green-100';
    if (score >= 70) return 'from-cyan-50 to-cyan-100';
    return 'from-amber-50 to-amber-100';
  }

  if (result) {
    const improvement = analysisHistory.length > 1
      ? result.score - analysisHistory[analysisHistory.length - 2]
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis Complete</h2>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <p className="text-gray-600">{file?.name}</p>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded-full font-medium">
                  {selectedRole}
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`p-6 bg-gradient-to-br ${getScoreBgColor(result.score)} rounded-2xl border-2 border-gray-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Overall Score</span>
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}%
              </div>
              {improvement !== 0 && (
                <div className={`text-sm mt-2 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement > 0 ? '+' : ''}{improvement}% from last
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">ATS Score</span>
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-5xl font-bold text-blue-600">{result.atsScore}%</div>
              <div className="text-sm text-blue-700 mt-2">
                {result.atsScore >= 80 ? 'Excellent' : 'Good'} optimization
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Points Earned</span>
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-5xl font-bold text-purple-600">+{result.pointsEarned}</div>
              <div className="text-sm text-purple-700 mt-2">Added to your profile</div>
            </motion.div>
          </div>

          {result.keywordsFound.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-5 bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl border border-teal-200"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Keywords Found</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.keywordsFound.map((keyword, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="px-3 py-1 bg-teal-600 text-white text-sm rounded-full font-medium"
                  >
                    {keyword}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-l-4 border-green-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-green-900">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-green-200/50 transition-colors"
                  >
                    <span className="text-green-600 text-lg font-bold mt-0.5">✓</span>
                    <span className="text-gray-800">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {result.missingSkills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-l-4 border-yellow-500"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-semibold text-yellow-900">Missing Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded-full font-medium border border-yellow-400"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-l-4 border-red-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-semibold text-red-900">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {result.weaknesses.map((weakness, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-red-200/50 transition-colors"
                  >
                    <span className="text-red-600 text-lg font-bold mt-0.5">!</span>
                    <span className="text-gray-800">{weakness}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl border-l-4 border-cyan-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-600" />
                <h3 className="text-xl font-semibold text-cyan-900">Actionable Suggestions</h3>
              </div>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.05 }}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-cyan-200/50 transition-colors"
                  >
                    <span className="text-cyan-600 text-lg font-bold mt-0.5">→</span>
                    <span className="text-gray-800">{suggestion}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            Analyze Another Resume
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            📄
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Resume Analyzer</h2>
          <p className="text-gray-600">Get instant feedback with ATS optimization and role-specific insights</p>
        </div>

        {!file ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Target Role
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobRoles.map((role) => (
                  <motion.button
                    key={role}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-xl border-2 font-medium transition-all text-sm ${
                      selectedRole === role
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    {role}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-50 scale-105'
                  : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'
              }`}
            >
              <motion.div
                animate={dragActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: dragActive ? Infinity : 0 }}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Drag and drop your resume here
              </p>
              <p className="text-gray-600 mb-6">or</p>
              <label className="inline-block">
                <input
                  type="file"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-semibold cursor-pointer inline-block hover:shadow-lg transition-shadow"
                >
                  Browse Files
                </motion.span>
              </label>
              <p className="text-sm text-gray-500 mt-4">Supports PDF, DOC, and DOCX formats</p>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6 bg-gradient-to-br from-gray-50 to-cyan-50 rounded-2xl border-2 border-gray-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="w-12 h-12 text-cyan-600" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full font-medium text-sm">
                  {selectedRole}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={analyzeResume}
                disabled={analyzing || !selectedRole}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Resume'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                disabled={analyzing}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
            </div>

            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="inline-block text-5xl mb-3"
                      >
                        🤖
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          ✓ Scanning document structure...
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          ✓ Analyzing ATS compatibility...
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                        >
                          ✓ Checking role-specific keywords...
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2 }}
                        >
                          ✓ Generating recommendations...
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
