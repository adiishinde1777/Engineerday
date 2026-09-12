import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Cpu, 
  Sparkles, 
  Award, 
  Search, 
  ShieldCheck, 
  BookOpen,
  Crown
} from 'lucide-react';
import { api } from '../utils/api';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getFaculty()
      .then((res) => {
        if (res.success) setFaculty(res.faculty);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const departmentTitle = "Department of Electronics Engineering (VLSI Design and Technology)";

  const filteredFaculty = faculty.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q) ||
      (f.position_role && f.position_role.toLowerCase().includes(q))
    );
  });

  // Helper to generate initials for avatar without pictures
  const getInitials = (name) => {
    return name
      .replace(/Dr\.|Prof\.|Mrs\.|Mr\./gi, '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .substring(0, 3)
      .toUpperCase();
  };

  const hod = filteredFaculty.find(f => f.name.toLowerCase().includes('shrikant honde')) || filteredFaculty[0];
  const otherFaculty = filteredFaculty.filter(f => f.id !== hod?.id);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider shadow-lg">
          <Cpu className="w-4 h-4 text-cyan-400" />
          {departmentTitle}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Department Faculty & Committee Positions
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Distinguished academic leaders, VLSI researchers, and tournament coordinators driving the technical symposium for Engineers' Day 2026.
        </p>
      </div>

      {/* Department Banner & Search */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/90 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">ORGANIZING DEPARTMENT</span>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading">
              Electronics Engineering (VLSI Design & Technology)
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search faculty name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading Department Faculty directory...
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Highlighted HOD Card */}
          {hod && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 relative overflow-hidden shadow-2xl shadow-cyan-500/10">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* Profile Picture or Monogram Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-sky-400 p-[2.5px] shadow-xl shadow-cyan-500/25 flex-shrink-0 overflow-hidden relative">
                  {hod.profile_image ? (
                    <img
                      src={hod.profile_image}
                      alt={hod.name}
                      className="w-full h-full object-cover rounded-[22px]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center ${hod.profile_image ? 'hidden' : 'flex'}`}>
                    <Crown className="w-6 h-6 text-amber-400 mb-1" />
                    <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white font-mono">
                      {getInitials(hod.name)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                      HEAD OF DEPARTMENT
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40 uppercase">
                      PATRON
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                    {hod.name}
                  </h2>

                  <p className="text-sm font-semibold text-cyan-300 font-mono">
                    {hod.designation} • {departmentTitle}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl pt-1">
                    {hod.description || 'Leading the Department of Electronics Engineering (VLSI Design and Technology) with visionary research in semiconductor architectures and tournament patron.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Other Faculty Members Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Faculty Members & Committee Coordinators
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherFaculty.map((f) => (
                <div
                  key={f.id}
                  className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-4 group shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    {/* Profile Picture or Monogram Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[1.5px] flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                      {f.profile_image ? (
                        <img
                          src={f.profile_image}
                          alt={f.name}
                          className="w-full h-full object-cover rounded-[14px]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-mono font-black text-sm sm:text-base text-cyan-300 ${f.profile_image ? 'hidden' : 'flex'}`}>
                        {getInitials(f.name)}
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase block w-fit">
                        {f.position_role || 'Faculty Coordinator'}
                      </span>
                      <h4 className="text-base font-bold text-white font-heading group-hover:text-cyan-300 transition-colors truncate">
                        {f.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-300">
                        {f.designation}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
                      <Cpu className="w-3 h-3" />
                      <span>VLSI Design & Technology</span>
                    </div>
                    {f.description && (
                      <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                        {f.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Symposium Committee Advisory Box */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4" />
            DEPARTMENT OF ELECTRONICS ENGINEERING (VLSI DESIGN & TECHNOLOGY)
          </div>
          <h3 className="text-xl font-bold text-white font-heading">
            Steering & Technical Jury Committee
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Under the guidance of HOD Dr. Shrikant Honde and faculty conveners, the symposium ensures rigorous technical evaluation, real-time timer verification, and fair play.
          </p>
        </div>

        <div className="px-5 py-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold whitespace-nowrap">
          Engineers' Day 2026 Committee
        </div>
      </div>

    </div>
  );
}
