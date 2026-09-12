import React, { useState } from 'react';
import { Download, FileSpreadsheet, Users, Trophy, GraduationCap, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAuthToken } from '../../utils/api';

export default function ExportTab() {
  const [downloading, setDownloading] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const exports = [
    {
      id: 'registrations',
      title: 'Registrations Master Sheet',
      desc: 'All registered squads, member rosters, captains, contact phone numbers, games, and verification flags.',
      url: '/api/export/registrations',
      filename: 'Engineers_Day_2026_Registrations.csv',
      icon: Users,
      color: 'text-cyan-400'
    },
    {
      id: 'scores',
      title: 'Game Scores & Telemetry Log',
      desc: 'Granular response records: question-by-question submitted answers, accuracy, microsecond response times, and time bonuses.',
      url: '/api/export/scores',
      filename: 'Engineers_Day_2026_Game_Scores.csv',
      icon: Trophy,
      color: 'text-amber-400'
    },
    {
      id: 'results',
      title: 'Final Competition Results',
      desc: 'Rankings, total cumulative scores, active round statuses, and tournament standing for valedictory awards.',
      url: '/api/export/results',
      filename: 'Engineers_Day_2026_Final_Results.csv',
      icon: Award,
      color: 'text-emerald-400'
    },
    {
      id: 'faculty',
      title: 'Faculty Mentors Directory',
      desc: 'Comprehensive list of department conveners, academic titles, departments, and positions.',
      url: '/api/export/faculty',
      filename: 'Engineers_Day_2026_Faculty.csv',
      icon: GraduationCap,
      color: 'text-purple-400'
    },
  ];

  const handleDownload = async (item) => {
    setDownloading(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = getAuthToken();
      // Fetch with auth token
      const response = await fetch(`${item.url}?token=${encodeURIComponent(token || '')}`, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Download failed with status ${response.status}`);
      }

      // Convert response to Blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download trigger element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', item.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setSuccessMsg(`Successfully downloaded ${item.filename}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Export download error:', err);
      setErrorMsg(err.message || 'Failed to download export file. Please check admin login.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white font-heading">
          EXPORT DATA CENTER
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Download CSV / Excel compatible datasets for official records, certificates, and auditing.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exports.map((exp) => {
          const Icon = exp.icon;
          const isCurrentLoading = downloading === exp.id;

          return (
            <div key={exp.id} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${exp.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">{exp.title}</h3>
                    <p className="text-xs font-mono text-slate-500">{exp.filename}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {exp.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleDownload(exp)}
                  disabled={isCurrentLoading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-white flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-cyan-500/40 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isCurrentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Generating & Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Download {exp.filename}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
