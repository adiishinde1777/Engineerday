import React from 'react';
import { Download, FileSpreadsheet, Users, Trophy, GraduationCap, Award } from 'lucide-react';

export default function ExportTab() {
  const exports = [
    {
      title: 'Registrations Master Sheet',
      desc: 'All registered squads, member rosters, captains, contact phone numbers, games, and verification flags.',
      url: '/api/export/registrations',
      filename: 'Engineers_Day_2026_Registrations.csv',
      icon: Users,
      color: 'text-cyan-400'
    },
    {
      title: 'Game Scores & Telemetry Log',
      desc: 'Granular response records: question-by-question submitted answers, accuracy, microsecond response times, and time bonuses.',
      url: '/api/export/scores',
      filename: 'Engineers_Day_2026_Game_Scores.csv',
      icon: Trophy,
      color: 'text-amber-400'
    },
    {
      title: 'Final Competition Results',
      desc: 'Rankings, total cumulative scores, active round statuses, and tournament standing for valedictory awards.',
      url: '/api/export/results',
      filename: 'Engineers_Day_2026_Final_Results.csv',
      icon: Award,
      color: 'text-emerald-400'
    },
    {
      title: 'Faculty Mentors Directory',
      desc: 'Comprehensive list of department conveners, academic titles, departments, and bios.',
      url: '/api/export/faculty',
      filename: 'Engineers_Day_2026_Faculty.csv',
      icon: GraduationCap,
      color: 'text-purple-400'
    },
  ];

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

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exports.map((exp, idx) => {
          const Icon = exp.icon;
          return (
            <div key={idx} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-6">
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
                <a
                  href={exp.url}
                  download={exp.filename}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-cyan-500/40"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download {exp.filename}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
