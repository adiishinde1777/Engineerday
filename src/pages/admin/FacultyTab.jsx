import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Cpu, 
  Award, 
  RefreshCw, 
  Search, 
  ShieldCheck,
  Crown
} from 'lucide-react';
import { api } from '../../utils/api';

export default function FacultyTab() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: 'Assistant Professor',
    department: 'Electronics Engineering (VLSI Design & Technology)',
    position_role: 'Faculty Coordinator',
    profile_image: '',
    description: ''
  });

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await api.getFaculty();
      if (res.success) setFaculty(res.faculty);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

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

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      designation: 'Assistant Professor',
      department: 'Electronics Engineering (VLSI Design & Technology)',
      position_role: 'Faculty Coordinator',
      profile_image: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f) => {
    setEditingId(f.id);
    setFormData({
      name: f.name,
      designation: f.designation,
      department: f.department || 'Electronics Engineering (VLSI Design & Technology)',
      position_role: f.position_role || 'Faculty Member',
      profile_image: '',
      description: f.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member?')) return;
    try {
      await api.deleteFaculty(id);
      fetchFaculty();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateFaculty(editingId, formData);
      } else {
        await api.createFaculty(formData);
      }
      setShowModal(false);
      fetchFaculty();
    } catch (err) {
      alert(err.message || 'Save failed');
    }
  };

  const filteredFaculty = faculty.filter(f => 
    !search || 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.designation.toLowerCase().includes(search.toLowerCase()) || 
    (f.position_role && f.position_role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-heading">
            DEPARTMENT FACULTY & POSITIONS
          </h2>
          <p className="text-xs font-mono text-cyan-400 mt-0.5">
            Department of Electronics Engineering (VLSI Design and Technology)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-md shadow-cyan-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member with Position
        </button>
      </div>

      {/* Search & Count bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="text-slate-400">
          Showing <strong className="text-cyan-400">{filteredFaculty.length}</strong> Faculty Members in <strong className="text-slate-200">VLSI Design & Technology</strong>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search faculty name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Grid of Faculty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((f) => {
          const isHOD = f.name.toLowerCase().includes('shrikant honde') || f.designation.toLowerCase().includes('head');

          return (
            <div
              key={f.id}
              className={`glass-card rounded-3xl border ${
                isHOD ? 'border-cyan-500/50 bg-gradient-to-b from-slate-900 to-cyan-950/20' : 'border-slate-800 bg-slate-900/80'
              } overflow-hidden flex flex-col justify-between shadow-lg hover:border-cyan-500/40 transition-all`}
            >
              <div className="p-5 flex items-start gap-4">
                {/* Monogram Avatar (No Profile Pic) */}
                <div className={`w-14 h-14 rounded-2xl ${
                  isHOD ? 'bg-gradient-to-tr from-amber-400 to-cyan-400' : 'bg-gradient-to-tr from-cyan-600 to-indigo-600'
                } p-[1.5px] flex-shrink-0`}>
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
                    {isHOD ? <Crown className="w-3.5 h-3.5 text-amber-400 mb-0.5" /> : null}
                    <span className="font-mono font-black text-xs sm:text-sm text-cyan-300">
                      {getInitials(f.name)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    VLSI Design & Technology
                  </span>
                  <h3 className="text-base font-bold text-white font-heading truncate">{f.name}</h3>

                  {/* Academic Position */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>{f.designation}</span>
                  </div>
                </div>
              </div>

              {/* Symposium Position Tag */}
              <div className="px-5 py-2 bg-slate-950/60 border-y border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[10px] uppercase">Committee Position:</span>
                <span className="text-cyan-300 font-semibold">{f.position_role || 'Faculty Member'}</span>
              </div>

              {f.description && (
                <div className="px-5 py-3 text-xs text-slate-400 font-sans line-clamp-2">
                  {f.description}
                </div>
              )}

              <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(f)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-cyan-400" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-500/30 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal without profile picture requirement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white font-heading">
              {editingId ? 'Edit Faculty Member' : 'Add Faculty Member with Position'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-mono">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Shrikant Honde"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono">Academic Position / Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Professor & Head of Department"
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-mono">Department</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value="Electronics Engineering (VLSI Design & Technology)"
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono">Symposium Position / Committee Role</label>
                <input
                  type="text"
                  value={formData.position_role}
                  onChange={(e) => setFormData({ ...formData, position_role: e.target.value })}
                  placeholder="e.g. Head of Department (HOD) & Patron / Faculty Convener"
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono">Short Description / Mentorship Focus (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specialization areas, VLSI design, student coordinator guidance..."
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-sans"
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
                  Save Faculty Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
