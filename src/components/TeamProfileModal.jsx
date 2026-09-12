import React, { useEffect, useState } from 'react';
import { X, Trophy, Users, Shield, Clock, Award, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function TeamProfileModal({ teamId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    api.getTeam(teamId)
      .then((res) => {
        if (res.success) {
          setData(res.team);
        }
      })
      .catch((err) => console.error('Failed to load team details:', err))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (!teamId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
                {data?.game === 'pictionary' ? 'Engineering Pictionary' : 'Engineer’s Brain'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Rank #{data?.rank || '-'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white font-heading tracking-tight">
              {loading ? 'Loading Team Profile...' : data?.team_name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              Captain: <strong className="text-slate-200">{data?.captain}</strong> • Contact: <span className="font-mono text-slate-300">{data?.contact}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading team statistics...
            </div>
          ) : data ? (
            <>
              {/* Members Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Team Roster (3 Members)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Member 1 (Captain)', name: data.member1 },
                    { label: 'Member 2', name: data.member2 },
                    { label: 'Member 3', name: data.member3 },
                  ].map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <p className="text-[10px] font-mono text-cyan-400/80 uppercase">{m.label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{m.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Round Scores Banner */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/20 grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Round 1</p>
                  <p className="text-xl font-black text-cyan-300 font-mono mt-1">{data.roundScores?.[1] || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Round 2</p>
                  <p className="text-xl font-black text-cyan-300 font-mono mt-1">{data.roundScores?.[2] || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-400">Round 3</p>
                  <p className="text-xl font-black text-cyan-300 font-mono mt-1">{data.roundScores?.[3] || 0}</p>
                </div>
                <div className="border-l border-slate-800 pl-2">
                  <p className="text-[10px] font-mono uppercase text-amber-400 font-bold">TOTAL SCORE</p>
                  <p className="text-2xl font-black text-amber-300 font-mono mt-0.5">{data.score || 0}</p>
                </div>
              </div>

              {/* Score History / Answer Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Answer & Performance History
                </h4>

                {data.answers && data.answers.length > 0 ? (
                  <div className="space-y-2">
                    {data.answers.map((ans, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          ans.is_correct === 1
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 font-bold">R{ans.round}</span>
                            <span className="text-slate-200 font-medium line-clamp-1">{ans.question}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            <span>Submitted: <strong className="text-slate-300">{ans.answer_text}</strong></span>
                            <span>•</span>
                            <span className="font-mono">Time: {ans.response_time}s</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:text-right flex-shrink-0">
                          {ans.is_correct === 1 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              +{ans.total_points} Pts ({ans.base_points} + {ans.time_bonus} bonus)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                              <XCircle className="w-4 h-4" />
                              {ans.total_points} Pts
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs font-mono">
                    No answer submissions recorded for this team yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Failed to load team data.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
