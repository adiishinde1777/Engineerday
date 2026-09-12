import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Palette, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { api } from '../../utils/api';

export default function QuestionBankTab() {
  const [questions, setQuestions] = useState([]);
  const [filterGame, setFilterGame] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    game: 'brain',
    round: 1,
    question: '',
    type: 'Multiple Choice',
    options: ['', '', '', ''],
    correct_answer: '',
    time_limit: 30,
    base_points: 10,
    image_url: ''
  });

  const questionTypes = [
    'Multiple Choice',
    'True/False',
    'Image Identification',
    'Identify Component',
    'Identify Chip',
    'Technology Identification',
    'Logical Reasoning',
    'Text Answer',
    'Electronics',
    'Mechanical',
    'Civil',
    'VLSI',
    'AI / Robotics'
  ];

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getQuestions({
        game: filterGame,
        round: filterRound,
        search: search.trim()
      });
      if (res.success) setQuestions(res.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filterGame, filterRound, search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      game: 'brain',
      round: 1,
      question: '',
      type: 'Multiple Choice',
      options: ['', '', '', ''],
      correct_answer: '',
      time_limit: 30,
      base_points: 10,
      image_url: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q.id);
    let opts = q.options || [];
    if (opts.length === 0 && q.type === 'Multiple Choice') {
      opts = ['', '', '', ''];
    }
    setFormData({
      game: q.game,
      round: q.round,
      question: q.question,
      type: q.type,
      options: opts,
      correct_answer: q.correct_answer,
      time_limit: q.time_limit,
      base_points: q.base_points,
      image_url: q.image_url || ''
    });
    setShowModal(true);
  };

  const handleDuplicate = async (id) => {
    try {
      await api.duplicateQuestion(id);
      fetchQuestions();
    } catch (err) {
      alert(err.message || 'Duplicate failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await api.deleteQuestion(id);
      fetchQuestions();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        options: formData.type === 'Multiple Choice' ? formData.options.filter(o => o.trim()) : formData.options
      };

      if (editingId) {
        await api.updateQuestion(editingId, payload);
      } else {
        await api.createQuestion(payload);
      }
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      alert(err.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            QUESTION BANK & PROMPTS
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Curate questions, attach component diagrams, set time limits, and assign rounds.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-md shadow-cyan-500/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Question
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
          >
            <option value="all">All Games</option>
            <option value="brain">Engineer's Brain</option>
            <option value="pictionary">Engineering Pictionary</option>
          </select>

          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
          >
            <option value="all">All Rounds</option>
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
            <option value="3">Round 3</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none font-mono text-xs"
            />
          </div>
          <button
            onClick={fetchQuestions}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 font-mono text-xs rounded-2xl border border-slate-800">
            NO QUESTIONS FOUND
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    q.game === 'brain' ? 'bg-cyan-950 text-cyan-400' : 'bg-indigo-950 text-indigo-400'
                  }`}>
                    {q.game}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    Round {q.round}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {q.type}
                  </span>
                  {q.image_url && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Image
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  {q.question}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                  <span>Answer: <strong className="text-emerald-400">{q.correct_answer}</strong></span>
                  <span>•</span>
                  <span>Timer: {q.time_limit}s</span>
                  <span>•</span>
                  <span>Base: {q.base_points} pts</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center flex-shrink-0">
                <button
                  onClick={() => handleDuplicate(q.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-500/30"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white font-heading">
              {editingId ? 'Edit Question' : 'Create Question'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono">Game Competition</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="brain">Engineer's Brain</option>
                    <option value="pictionary">Engineering Pictionary</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-mono">Round Number</label>
                  <select
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="1">Round 1</option>
                    <option value="2">Round 2</option>
                    <option value="3">Round 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono">Question / Concept Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter full technical question text..."
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-mono">Question Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  >
                    {questionTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-mono">Timer (Seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={formData.time_limit}
                    onChange={(e) => setFormData({ ...formData, time_limit: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-mono">Base Points</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={formData.base_points}
                    onChange={(e) => setFormData({ ...formData, base_points: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Options for MCQ */}
              {formData.type === 'Multiple Choice' && (
                <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="text-slate-300 font-mono">Options (A, B, C, D)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 text-center font-mono font-bold text-cyan-400">{letter}:</span>
                        <input
                          type="text"
                          value={formData.options[idx] || ''}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx] = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder={`Option ${letter}`}
                          className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              <div>
                <label className="text-slate-300 font-mono">Correct Answer (Exact String)</label>
                <input
                  type="text"
                  required
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  placeholder="e.g. Sir Mokshagundam Visvesvaraya or XOR Gate"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-slate-300 font-mono">Image URL (Optional for Chip / Component ID)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  {editingId ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
