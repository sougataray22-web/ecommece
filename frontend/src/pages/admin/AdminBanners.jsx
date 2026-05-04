import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { Plus, Trash2, Edit3, GripVertical, Eye, EyeOff, X, Upload } from 'lucide-react';

export default function AdminBanners() {
  const [banners,  setBanners]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    title: '', subtitle: '', targetType: 'none',
    targetId: '', targetUrl: '', position: 0,
    isActive: true, startDate: '', endDate: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef();

  const fetchBanners = () => {
    api.get('/banners/admin').then((r) => setBanners(r.data.banners || []))
       .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', targetType: 'none', targetId: '', targetUrl: '', position: banners.length, isActive: true, startDate: '', endDate: '' });
    setImageFile(null); setImagePreview('');
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle || '', targetType: b.targetType || 'none',
      targetId: b.targetId || '', targetUrl: b.targetUrl || '',
      position: b.position, isActive: b.isActive,
      startDate: b.startDate ? b.startDate.slice(0,10) : '',
      endDate:   b.endDate   ? b.endDate.slice(0,10)   : '',
    });
    setImagePreview(b.imageUrl); setImageFile(null);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing && !imageFile) return toast.error('Banner image is required.');
    if (!form.title.trim()) return toast.error('Title is required.');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await api.patch(`/banners/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Banner updated.');
      } else {
        await api.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Banner created.');
      }
      setShowForm(false);
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted.');
      fetchBanners();
    } catch { toast.error('Delete failed.'); }
  };

  const toggleActive = async (b) => {
    try {
      await api.patch(`/banners/${b._id}`, { isActive: !b.isActive });
      fetchBanners();
    } catch { toast.error('Failed to toggle.'); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hero Banner Management</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage homepage sliders and promotional banners</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold
                       px-5 py-2.5 rounded-xl transition-all">
            <Plus size={16} /> Add Banner
          </button>
        </div>

        {/* Banner list */}
        {loading ? <Loader /> : banners.length === 0 ? (
          <EmptyState onAdd={openCreate} />
        ) : (
          <div className="space-y-4">
            {banners.map((b) => (
              <div key={b._id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex items-stretch">
                {/* Drag handle */}
                <div className="flex items-center px-4 text-neutral-700">
                  <GripVertical size={18} />
                </div>

                {/* Thumbnail */}
                <div className="w-40 h-24 shrink-0 bg-neutral-800 overflow-hidden">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{b.title}</h3>
                      {b.subtitle && <p className="text-neutral-400 text-sm">{b.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        b.isActive ? 'text-green-400 bg-green-400/10 border-green-400/30'
                                   : 'text-neutral-500 bg-neutral-800 border-neutral-700'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>Position: {b.position}</span>
                    {b.targetType !== 'none' && <span>→ {b.targetType}: {b.targetId || b.targetUrl}</span>}
                    {b.startDate && <span>From {new Date(b.startDate).toLocaleDateString()}</span>}
                    {b.endDate   && <span>To {new Date(b.endDate).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 border-l border-neutral-800">
                  <button onClick={() => toggleActive(b)}
                    title={b.isActive ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                    {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => openEdit(b)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(b._id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form Modal ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-bold text-white">{editing ? 'Edit Banner' : 'Create Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Banner Image {!editing && '*'}</label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-neutral-700" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(editing?.imageUrl || ''); }}
                      className="absolute top-2 right-2 bg-neutral-900 border border-neutral-700 rounded-full p-1.5 text-neutral-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-neutral-700 hover:border-amber-400 rounded-xl py-10
                               flex flex-col items-center gap-2 text-neutral-500 hover:text-amber-400 transition-colors">
                    <Upload size={24} />
                    <span className="text-sm">Click to upload image</span>
                    <span className="text-xs">Recommended: 1920×600px</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <FormInput label="Title *" value={form.title} onChange={(v) => setForm({...form, title: v})} placeholder="Summer Sale — Up to 50% Off" />
              <FormInput label="Subtitle" value={form.subtitle} onChange={(v) => setForm({...form, subtitle: v})} placeholder="Shop now for the best deals" />

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Link Type</label>
                <select value={form.targetType} onChange={(e) => setForm({...form, targetType: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400">
                  <option value="none">No Link</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                  <option value="url">Custom URL</option>
                </select>
              </div>

              {form.targetType === 'url' && (
                <FormInput label="URL" value={form.targetUrl} onChange={(v) => setForm({...form, targetUrl: v})} placeholder="https://…" />
              )}
              {(form.targetType === 'category' || form.targetType === 'product') && (
                <FormInput label={`${form.targetType} ID`} value={form.targetId} onChange={(v) => setForm({...form, targetId: v})} placeholder="MongoDB ObjectId" />
              )}

              <FormInput label="Position (sort order)" type="number" value={form.position} onChange={(v) => setForm({...form, position: v})} />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Start Date" type="date" value={form.startDate} onChange={(v) => setForm({...form, startDate: v})} />
                <FormInput label="End Date"   type="date" value={form.endDate}   onChange={(v) => setForm({...form, endDate: v})} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({...form, isActive: !form.isActive})}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-amber-400' : 'bg-neutral-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-neutral-300">Active</span>
              </label>

              <button type="submit" disabled={saving}
                className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold py-3 rounded-xl transition-all disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Update Banner' : 'Create Banner'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const FormInput = ({ label, value, onChange, type = 'text', ...rest }) => (
  <div>
    <label className="block text-sm text-neutral-400 mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors" />
  </div>
);

const Loader = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const EmptyState = ({ onAdd }) => (
  <div className="text-center py-20">
    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Upload size={28} className="text-neutral-600" />
    </div>
    <h3 className="text-white font-semibold mb-2">No banners yet</h3>
    <p className="text-neutral-500 text-sm mb-6">Create your first homepage banner</p>
    <button onClick={onAdd}
      className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-6 py-2.5 rounded-xl transition-all">
      Add First Banner
    </button>
  </div>
);
