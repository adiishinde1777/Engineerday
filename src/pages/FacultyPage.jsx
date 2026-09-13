import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Cpu, 
  Crown, 
  Camera, 
  Edit3, 
  X, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  ShieldCheck, 
  Search,
  ExternalLink
} from 'lucide-react';
import { api, getAuthToken } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function FacultyPage({ setCurrentPage }) {
  const { isAuthenticated } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Edit Modal for Admin
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    position_role: 'Faculty Coordinator',
    is_hod: 0,
    profile_image: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchFaculty = async () => {
    try {
      const res = await api.getFaculty();
      if (res.success && res.faculty) {
        setFaculty(res.faculty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Open Edit Modal for Admin
  const handleOpenEdit = (f) => {
    setEditingFaculty(f);
    const isHodFlag = Boolean(
      f.is_hod === 1 || 
      f.is_hod === true || 
      f.position_role?.toLowerCase().includes('hod') || 
      f.name?.toLowerCase().includes('honade') ||
      f.name?.toLowerCase().includes('honde')
    );
    setEditFormData({
      name: f.name || '',
      position_role: isHodFlag ? 'Head of Department (HoD)' : 'Faculty Coordinator',
      is_hod: isHodFlag ? 1 : 0,
      profile_image: f.profile_image || ''
    });
    setSaveSuccess(false);
  };

  // Handle Photo Upload from file
  const handlePhotoUpload = async (e) => {
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
        setEditFormData(prev => ({ ...prev, profile_image: data.imageUrl }));
      } else {
        // Base64 fallback
        const reader = new FileReader();
        reader.onload = () => {
          setEditFormData(prev => ({ ...prev, profile_image: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setEditFormData(prev => ({ ...prev, profile_image: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit edits
  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsSaving(true);
    try {
      const payload = {
        name: editFormData.name.trim(),
        position_role: editFormData.is_hod === 1 ? 'Head of Department (HoD)' : 'Faculty Coordinator',
        is_hod: editFormData.is_hod,
        profile_image: editFormData.profile_image
      };
      const res = await api.updateFaculty(editingFaculty.id, payload);
      if (res.success) {
        setSaveSuccess(true);
        await fetchFaculty();
        setTimeout(() => {
          setEditingFaculty(null);
          setSaveSuccess(false);
        }, 600);
      } else {
        alert(res.message || 'Failed to update faculty member');
      }
    } catch (err) {
      alert(err.message || 'Error saving faculty details');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to generate initials for avatar
  const getInitials = (name) => {
    return name
      .replace(/Dr\.|Prof\.|Mrs\.|Mr\.|Ms\./gi, '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter based on search query if present
  const filteredFaculty = faculty.filter(f => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isHoD = (f) => Boolean(
    f.is_hod === 1 || 
    f.is_hod === true || 
    f.position_role?.toLowerCase().includes('hod') || 
    f.name?.toLowerCase().includes('honade') ||
    f.name?.toLowerCase().includes('honde')
  );

  const hodMember = filteredFaculty.find(isHoD);
  const otherMembers = filteredFaculty.filter(f => f.id !== hodMember?.id);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Department of Electronics Engineering (VLSI Design and Technology)
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
          Department Faculty
        </h1>
      </div>

      {/* Admin Action Bar */}
      {isAuthenticated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase block">
                ADMINISTRATION PRIVILEGE ACTIVE
              </span>
              <p className="text-xs text-slate-300">
                Click <span className="text-cyan-300 font-bold">Edit / Photo</span> on any card to update their name or upload their profile picture.
              </p>
            </div>
          </div>

          {setCurrentPage && (
            <button
              type="button"
              onClick={() => setCurrentPage('admin')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Full Faculty Console</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center font-mono text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading faculty directory...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. Head of Department (HOD) Featured Card */}
          {hodMember && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 relative overflow-hidden shadow-2xl shadow-amber-500/10">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
                
                {/* HOD Profile Picture or Avatar */}
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 p-[2.5px] shadow-xl shadow-amber-500/20 shrink-0 overflow-hidden">
                    {hodMember.profile_image ? (
                      <img
                        src={hodMember.profile_image}
                        alt={hodMember.name}
                        className="w-full h-full object-cover rounded-[21px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-950 rounded-[21px] flex flex-col items-center justify-center font-mono font-black text-2xl text-amber-300">
                        <Crown className="w-7 h-7 text-amber-400 mb-1" />
                        <span>{getInitials(hodMember.name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Photo Upload Trigger for Admin */}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(hodMember)}
                      className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg cursor-pointer transition-all hover:scale-105"
                      title="Upload / Change HOD Photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* HOD Info: ONLY Name and HoD Tag */}
                <div className="text-center sm:text-left space-y-2.5 flex-1">
                  <div>
                    <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase inline-flex items-center gap-1.5 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      Head of Department (HoD)
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black text-white font-heading tracking-tight">
                    {hodMember.name}
                  </h2>
                </div>

                {/* Admin Edit Button */}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(hodMember)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer self-center sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. Remaining 12 Faculty Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {otherMembers.map((f) => (
              <div
                key={f.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 transition-all duration-300 flex flex-col items-center text-center space-y-3.5 group relative shadow-lg"
              >
                {/* Profile Picture or Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-md shadow-cyan-500/10">
                    {f.profile_image ? (
                      <img
                        src={f.profile_image}
                        alt={f.name}
                        className="w-full h-full object-cover rounded-[14px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-mono font-black text-base text-cyan-300">
                        {getInitials(f.name)}
                      </div>
                    )}
                  </div>

                  {/* Admin Direct Photo Button */}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(f)}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer transition-all hover:scale-105"
                      title="Upload / Change Photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Faculty Details: ONLY Name & Faculty Coordinator Tag */}
                <div className="space-y-1.5 w-full">
                  <h3 className="text-base font-bold text-white font-heading group-hover:text-cyan-300 transition-colors truncate px-1">
                    {f.name}
                  </h3>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 uppercase inline-block">
                      Faculty Coordinator
                    </span>
                  </div>
                </div>

                {/* Admin Quick Edit Button */}
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(f)}
                    className="w-full pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Faculty</span>
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* QUICK EDIT MODAL FOR ADMIN */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Edit Faculty Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFaculty(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs font-mono">
              
              {/* Profile Picture Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Profile Picture</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Photo Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 p-[1.5px] relative shrink-0 overflow-hidden flex items-center justify-center">
                    {editFormData.profile_image ? (
                      <>
                        <img
                          src={editFormData.profile_image}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({ ...prev, profile_image: '' }))}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-500"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                        <span className="text-[9px]">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload from file button */}
                  <div className="space-y-2 flex-1">
                    <label className="block w-full">
                      <span className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-bold text-center block cursor-pointer transition-colors">
                        {uploadingImage ? 'Uploading...' : '📁 Upload Photo from Device'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={editFormData.profile_image}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, profile_image: e.target.value }))}
                      placeholder="Or paste image URL here..."
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Faculty Name */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Faculty Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Dr. Shrikant Honade"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-sans"
                />
              </div>

              {/* Tag / Role Selection: HoD or Faculty Coordinator */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Role Tag *
                </label>
                <select
                  value={editFormData.is_hod === 1 ? 'hod' : 'coordinator'}
                  onChange={(e) => {
                    const isHodChoice = e.target.value === 'hod';
                    setEditFormData(prev => ({
                      ...prev,
                      is_hod: isHodChoice ? 1 : 0,
                      position_role: isHodChoice ? 'Head of Department (HoD)' : 'Faculty Coordinator'
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                >
                  <option value="coordinator">Faculty Coordinator</option>
                  <option value="hod">Head of Department (HoD)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {editFormData.is_hod === 1
                    ? '★ Head of Department receives the golden HoD tag and featured showcase.'
                    : 'Standard faculty member with the Faculty Coordinator tag.'}
                </p>
              </div>

              {/* Save & Cancel Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'SAVING...' : saveSuccess ? '✓ SAVED!' : 'SAVE FACULTY DATA'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
