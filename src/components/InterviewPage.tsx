import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ArrowRight, CheckCircle, Mic, MicOff, ThumbsUp, Lightbulb, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const jobRoles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'Marketing Manager',
  'Sales Executive'
];

const difficulties = ['easy', 'medium', 'hard'];

interface Question {
  id: string;
  question_text: string;
  answer_text: string;
  ai_feedback: string;
  score: number;
}

export default function InterviewPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'interview' | 'complete'>('setup');
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [coachMood, setCoachMood] = useState<'thinking' | 'happy' | 'encouraging' | 'neutral'>('neutral');
  const [feedback, setFeedback] = useState<{strengths: string[], weaknesses: string[], tips: string[]} | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function startInterview() {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const { data: session } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user!.id,
          job_role: selectedRole,
          difficulty,
          status: 'in_progress'
        })
        .select()
        .single();

      setSessionId(session.id);
      await generateQuestion(session.id);
      setStep('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateQuestion(sessId: string) {
    setIsTyping(true);

    const sampleQuestions = {
      'Software Engineer': [
        'Tell me about a challenging bug you fixed recently.',
        'How do you approach system design for scalable applications?',
        'Explain the difference between SQL and NoSQL databases.'
      ],
      'Product Manager': [
        'How do you prioritize features in a product roadmap?',
        'Describe a time when you had to make a difficult product decision.',
        'How do you measure product success?'
      ],
      'Data Scientist': [
        'How do you handle missing data in a dataset?',
        'Explain the bias-variance tradeoff.',
        'Describe your approach to building a machine learning model.'
      ]
    };

    const roleQuestions = sampleQuestions[selectedRole as keyof typeof sampleQuestions] || [
      'Tell me about yourself and your experience.',
      'What are your key strengths?',
      'Why do you want this role?'
    ];

    const questionText = roleQuestions[currentQuestionIndex % roleQuestions.length];

    setTimeout(async () => {
      const { data: question } = await supabase
        .from('interview_questions')
        .insert({
          session_id: sessId,
          question_text: questionText,
          answer_text: '',
          ai_feedback: '',
          score: 0
        })
        .select()
        .single();

      setQuestions([...questions, question]);
      setIsTyping(false);
    }, 2000);
  }

  function generateAIFeedback(ans: string): {text: string, strengths: string[], weaknesses: string[], tips: string[], score: number} {
    const wordCount = ans.split(' ').length;
    const hasExamples = ans.toLowerCase().includes('example') || ans.toLowerCase().includes('instance');
    const hasMetrics = /\d+/.test(ans);

    let score = 70;
    const strengths = [];
    const weaknesses = [];
    const tips = [];

    if (wordCount > 50) {
      score += 10;
      strengths.push('Comprehensive answer with good detail');
    } else {
      weaknesses.push('Answer could be more detailed');
      tips.push('Try to elaborate more on your points with specific examples');
    }

    if (hasExamples) {
      score += 10;
      strengths.push('Provided concrete examples');
    } else {
      weaknesses.push('Missing specific examples');
      tips.push('Use the STAR method: Situation, Task, Action, Result');
    }

    if (hasMetrics) {
      score += 10;
      strengths.push('Quantified impact with metrics');
    } else {
      tips.push('Include numbers and metrics to demonstrate impact');
    }

    if (ans.length > 200) {
      strengths.push('Clear and confident communication style');
    }

    const feedbackText = score >= 85
      ? 'Excellent answer! You demonstrated strong understanding and communication skills.'
      : score >= 75
      ? 'Good response! With a few improvements, this could be even stronger.'
      : 'Solid attempt! Focus on the feedback below to enhance your answer.';

    return { text: feedbackText, strengths, weaknesses, tips, score };
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setCoachMood('thinking');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const simulatedText = 'In my previous role, I worked on a project where I increased system performance by 40%. I analyzed the bottlenecks and implemented caching strategies.';
          setAnswer(prev => prev + ' ' + simulatedText);
          setCoachMood('happy');
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setCoachMood('encouraging');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) return;

    setLoading(true);
    setCoachMood('thinking');
    const currentQuestion = questions[currentQuestionIndex];

    const feedbackData = generateAIFeedback(answer);
    setFeedback({ strengths: feedbackData.strengths, weaknesses: feedbackData.weaknesses, tips: feedbackData.tips });

    await supabase
      .from('interview_questions')
      .update({
        answer_text: answer,
        ai_feedback: feedbackData.text,
        score: feedbackData.score
      })
      .eq('id', currentQuestion.id);

    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      answer_text: answer,
      ai_feedback: feedbackData.text,
      score: feedbackData.score
    };
    setQuestions(updatedQuestions);

    setCoachMood('happy');

    setTimeout(() => {
      setAnswer('');
      setFeedback(null);
      setCoachMood('neutral');
    }, 5000);

    if (currentQuestionIndex < 2) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      await generateQuestion(sessionId);
    } else {
      const avgScore = Math.floor(
        updatedQuestions.reduce((sum, q) => sum + q.score, 0) / updatedQuestions.length
      );

      await supabase
        .from('interview_sessions')
        .update({
          status: 'completed',
          score: avgScore,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (progress) {
        const newTotal = progress.total_interviews + 1;
        const newAvg = ((progress.average_score * progress.total_interviews) + avgScore) / newTotal;

        await supabase
          .from('user_progress')
          .update({
            total_interviews: newTotal,
            average_score: newAvg,
            interviews_this_week: progress.interviews_this_week + 1,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user!.id);
      }

      setStep('complete');
    }

    setLoading(false);
  }

  function resetInterview() {
    setStep('setup');
    setSelectedRole('');
    setSessionId('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswer('');
    setFeedback(null);
    setCoachMood('neutral');
  }

  function getCoachEmoji() {
    switch(coachMood) {
      case 'happy': return '😊';
      case 'thinking': return '🤔';
      case 'encouraging': return '👍';
      default: return '🤖';
    }
  }

  if (step === 'complete') {
    const avgScore = Math.floor(
      questions.reduce((sum, q) => sum + q.score, 0) / questions.length
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Complete!
            </h2>
            <p className="text-xl text-gray-600">
              Your Average Score: <span className="font-bold text-cyan-600">{avgScore}%</span>
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-gradient-to-br from-gray-50 to-cyan-50 rounded-2xl"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">{q.question_text}</p>
                    <p className="text-sm text-gray-600 mb-3">{q.answer_text}</p>
                    <div className="p-3 bg-white rounded-lg border border-cyan-200">
                      <p className="text-sm text-gray-700">{q.ai_feedback}</p>
                      <p className="text-sm font-semibold text-cyan-600 mt-2">
                        Score: {q.score}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetInterview}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            Start New Interview
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (step === 'interview') {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {selectedRole} Interview
              </h2>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of 3</p>
            </div>
            <motion.div
              animate={{
                scale: coachMood === 'encouraging' ? [1, 1.1, 1] : 1,
                rotate: coachMood === 'thinking' ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.5, repeat: coachMood === 'encouraging' ? Infinity : 0 }}
              className="text-6xl"
            >
              {getCoachEmoji()}
            </motion.div>
          </div>

          <div className="mb-8">
            <div className="flex space-x-2 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i <= currentQuestionIndex ? 'bg-cyan-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2 text-gray-600"
                >
                  <Sparkles className="w-5 h-5 animate-pulse text-cyan-500" />
                  <span>AI is thinking...</span>
                </motion.div>
              ) : currentQuestion ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-gray-50 rounded-2xl mb-6">
                    <p className="text-lg font-medium text-gray-900">
                      {currentQuestion.question_text}
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here or use the microphone..."
                      rows={6}
                      className="w-full p-4 pr-16 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleRecording}
                      className={`absolute right-4 top-4 p-3 rounded-full transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-100 text-gray-600 hover:bg-cyan-100 hover:text-cyan-600'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </motion.button>
                  </div>

                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-3"
                    >
                      {feedback.strengths.length > 0 && (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <ThumbsUp className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-900">Strengths</span>
                          </div>
                          <ul className="space-y-1 text-sm text-green-800">
                            {feedback.strengths.map((s, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {feedback.weaknesses.length > 0 && (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-lg"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold text-amber-900">Weaknesses</span>
                          </div>
                          <ul className="space-y-1 text-sm text-amber-800">
                            {feedback.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {feedback.tips.length > 0 && (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 border-l-4 border-cyan-500 rounded-lg"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-cyan-600" />
                            <span className="font-semibold text-cyan-900">Tips for Improvement</span>
                          </div>
                          <ul className="space-y-1 text-sm text-cyan-800">
                            {feedback.tips.map((t, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2">💡</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitAnswer}
                    disabled={!answer.trim() || loading}
                    className="mt-4 w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <span>{loading ? 'Analyzing...' : 'Submit Answer'}</span>
                    <Send className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
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
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🎯
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Mock Interview
          </h2>
          <p className="text-gray-600">
            Choose your target role and difficulty level
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Job Role
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {jobRoles.map((role) => (
              <motion.button
                key={role}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRole(role)}
                className={`p-4 rounded-xl border-2 font-medium transition-all ${
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

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((diff) => (
              <motion.button
                key={diff}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(diff)}
                className={`p-4 rounded-xl border-2 font-medium transition-all capitalize ${
                  difficulty === diff
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 hover:border-cyan-300'
                }`}
              >
                {diff}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startInterview}
          disabled={!selectedRole || loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'Preparing...' : 'Start Interview'}</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
