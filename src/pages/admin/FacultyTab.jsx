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
  Crown,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { api, getAuthToken } from '../../utils/api';

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
    is_hod: 0,
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

  const isFacultyHOD = (f) => Boolean(
    f.is_hod === 1 ||
    f.is_hod === true ||
    f.position_role?.toLowerCase().includes('hod') ||
    f.position_role?.toLowerCase().includes('head of department') ||
    f.designation?.toLowerCase().includes('hod') ||
    f.designation?.toLowerCase().includes('head of department') ||
    f.designation?.toLowerCase().includes('head') ||
    f.name?.toLowerCase().includes('honde') ||
    f.name?.toLowerCase().includes('honade')
  );

  const handleSetHOD = async (id) => {
    try {
      await api.setFacultyHOD(id);
      fetchFaculty();
    } catch (err) {
      alert(err.message || 'Failed to designate HOD');
    }
  };

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
      is_hod: 0,
      profile_image: '',
      description: ''
    });
    setShowModal(true);
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const token = getAuthToken();
      const body = new FormData();
      body.append('image', file);
      const res = await fetch('/api/faculty/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setFormData(prev => ({ ...prev, profile_image: data.imageUrl }));
      } else {
        const reader = new FileReader();
        reader.onload = () => setFormData(prev => ({ ...prev, profile_image: reader.result }));
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, profile_image: reader.result }));
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenEdit = (f) => {
    setEditingId(f.id);
    const hodFlag = isFacultyHOD(f) ? 1 : 0;
    setFormData({
      name: f.name,
      designation: f.designation,
      department: f.department || 'Electronics Engineering (VLSI Design & Technology)',
      position_role: f.position_role || 'Faculty Member',
      is_hod: f.is_hod !== undefined ? f.is_hod : hodFlag,
      profile_image: f.profile_image || '',
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
          const isHOD = isFacultyHOD(f);

          return (
            <div
              key={f.id}
              className={`glass-card rounded-3xl border ${
                isHOD ? 'border-cyan-500/50 bg-gradient-to-b from-slate-900 to-cyan-950/20' : 'border-slate-800 bg-slate-900/80'
              } overflow-hidden flex flex-col justify-between shadow-lg hover:border-cyan-500/40 transition-all`}
            >
              <div className="p-5 flex items-start gap-4">
                {/* Profile Picture or Monogram Avatar */}
                <div className={`w-14 h-14 rounded-2xl ${
                  isHOD ? 'bg-gradient-to-tr from-amber-400 to-cyan-400' : 'bg-gradient-to-tr from-cyan-600 to-indigo-600'
                } p-[1.5px] flex-shrink-0 overflow-hidden relative group`}>
                  {f.profile_image ? (
                    <img
                      src={f.profile_image}
                      alt={f.name}
                      className="w-full h-full object-cover rounded-[14px]"
                      onError={(e) => {
                        // If image fails to load, hide image and show initials
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center ${f.profile_image ? 'hidden' : 'flex'}`}
                  >
                    {isHOD ? <Crown className="w-3.5 h-3.5 text-amber-400 mb-0.5" /> : null}
                    <span className="font-mono font-black text-xs sm:text-sm text-cyan-300">
                      {getInitials(f.name)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      VLSI Tech
                    </span>
                    {isHOD && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase flex items-center gap-1 ml-auto">
                        <Crown className="w-2.5 h-2.5 text-amber-400" />
                        HOD
                      </span>
                    )}
                  </div>
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
                {!isHOD && (
                  <button
                    type="button"
                    onClick={() => handleSetHOD(f.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-1 transition-all mr-auto"
                    title="Designate this member as Head of Department (HOD)"
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Make HOD</span>
                  </button>
                )}
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
              {/* HOD Status Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-amber-400/40 transition-all select-none">
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_hod)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      is_hod: checked ? 1 : 0,
                      position_role: checked ? 'Head of Department (HOD) & Patron' : (prev.position_role?.includes('HOD') ? 'Faculty Member' : prev.position_role),
                      designation: checked && !prev.designation.toLowerCase().includes('head') ? 'Head of Department & Professor' : prev.designation
                    }));
                  }}
                  className="w-4 h-4 text-amber-500 rounded border-slate-700 focus:ring-amber-400 accent-amber-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-300 block">
                      Head of Department (HOD) & Tournament Patron
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Featured in the prominent HOD card and symposium steering panel
                    </span>
                  </div>
                </div>
              </label>

              <div>
                <label className="text-slate-300 font-mono">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Faculty Name"
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
                <label className="text-slate-300 font-mono">Role Tag</label>
                <select
                  value={formData.is_hod === 1 ? 'hod' : (formData.position_role?.toLowerCase().includes('coordinator') ? 'coordinator' : 'custom')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'hod') {
                      setFormData(prev => ({ ...prev, is_hod: 1, position_role: 'Head of Department (HoD)' }));
                    } else if (val === 'coordinator') {
                      setFormData(prev => ({ ...prev, is_hod: 0, position_role: 'Faculty Coordinator' }));
                    }
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                >
                  <option value="coordinator">Faculty Coordinator</option>
                  <option value="hod">Head of Department (HoD)</option>
                  <option value="custom">Custom Tag: {formData.position_role}</option>
                </select>
              </div>

              {/* Profile Picture Upload & Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-mono font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    Faculty Profile Picture
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">JPG, PNG or WebP</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Photo Preview or Monogram Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 p-[1.5px] relative shrink-0 overflow-hidden flex items-center justify-center">
                    {formData.profile_image ? (
                      <>
                        <img
                          src={formData.profile_image}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, profile_image: '' })}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-500"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 text-center">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                        <span className="text-[9px] font-mono">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className={`px-3 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 cursor-pointer transition-all ${
                        uploadingImage ? 'opacity-50 cursor-wait' : ''
                      }`}>
                        {uploadingImage ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingImage ? 'Uploading...' : 'Choose Photo File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>

                      {formData.profile_image && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, profile_image: '' })}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-mono text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={formData.profile_image}
                      onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
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
