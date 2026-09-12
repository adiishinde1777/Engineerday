import React from 'react';
import { Calendar, Award, CheckCircle2, Clock, MapPin, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export default function AboutEventPage({ setCurrentPage, eventSettings }) {
  const reportingNote = eventSettings?.reportingInstructions || "All team members must report at the Technical Auditorium 30 minutes prior to Round 1 with valid college ID cards.";

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Title section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          COMMEMORATING SIR M. VISVESVARAYA
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          About Engineers’ Day 2026
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Organized by the <strong className="text-cyan-400">Department of Electronics Engineering (VLSI Design and Technology)</strong>. Celebrated across India every 15th of September in tribute to the great engineer, statesman, and builder of modern India, Bharat Ratna Sir Mokshagundam Visvesvaraya.
        </p>
      </div>

      {/* Tribute Card */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900 flex flex-col md:flex-row items-center gap-8">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"
            alt="Engineering Innovation"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-3">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            Inspiration & Heritage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            "Remember, your work is only done when it satisfies your own high standard."
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Sir M. Visvesvaraya designed the Krishna Raja Sagara dam, flood defense systems for Hyderabad, and automated floodgates installed at Khadakwasla. His timeless principles of meticulous planning, technical rigor, and innovative design form the foundational spirit of this symposium.
          </p>
        </div>
      </div>

      {/* Event Details & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Schedule */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Symposium Schedule • 15 September 2026
          </h3>
          <div className="space-y-4 text-sm font-mono">
            {[
              { time: '09:00 AM – 09:45 AM', title: 'Inauguration & Floral Tribute to Sir MV', desc: 'Opening keynote by dignitaries and faculty conveners' },
              { time: '10:00 AM – 12:30 PM', title: 'Engineer’s Brain (Rounds 1, 2 & 3)', desc: 'Rapid technical elimination & fast-answering championship' },
              { time: '12:30 PM – 01:30 PM', title: 'Lunch & Exhibition Break', desc: 'Departmental project gallery and networking' },
              { time: '01:30 PM – 04:00 PM', title: 'Engineering Pictionary (Rounds 1, 2 & 3)', desc: 'Live digital canvas drawing and concept deciphering' },
              { time: '04:30 PM – 05:30 PM', title: 'Grand Valedictory & Prize Distribution', desc: 'Felicitation of champions and runner-up teams' },
            ].map((s, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-xs text-cyan-400 font-bold">{s.time}</span>
                <p className="text-white font-sans font-bold text-sm mt-0.5">{s.title}</p>
                <p className="text-slate-400 font-sans text-xs mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reporting instructions & Rules */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Important Guidelines & Instructions
          </h3>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs sm:text-sm leading-relaxed">
            <strong>Official Reporting Advisory:</strong> {reportingNote}
          </div>

          <ul className="space-y-3 text-sm text-slate-300">
            {[
              'Each team must consist of exactly 3 registered members with a designated captain.',
              'Cross-department teams are welcomed and encouraged.',
              'Cell phones or external internet search during active rounds are strictly prohibited.',
              'Scores and rankings update in real time with server-side response-time validation.',
              'Judges and event convener decisions will be final and binding on all queries.',
            ].map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentPage('register')}
              className="w-full py-3 rounded-xl font-bold text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-500/20"
            >
              Proceed to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
