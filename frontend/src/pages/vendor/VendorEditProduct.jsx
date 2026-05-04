import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { ArrowLeft, Upload, Plus, X, Trash2 } from 'lucide-react';

export default function VendorEditProduct() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [product,    setProduct]    = useState(null);
  const [categories, setCategories] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [newImages,  setNewImages]  = useState([]);
  const [previews,   setPreviews]   = useState([]);

  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: '',
    subCategory: '', tags: '',
    basePrice: '', baseMrp: '', baseStock: '',
    weight: '', freeShipping: false, shippingCharges: '0',
    metaTitle: '', metaDescription: '',
    isActive: true, isFeatured: false,
  });

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.categories || [])).catch(() => {});
    api.get(`/products/vendor/${id}`).then((r) => {
      const p = r.data.product;
      setProduct(p);
      setForm({
        name:            p.name         || '',
        description:     p.description  || '',
        brand:           p.brand        || '',
        category:        p.category?._id || p.category || '',
        subCategory:     p.subCategory  || '',
        tags:            (p.tags || []).join(', '),
        basePrice:       p.basePrice    || '',
        baseMrp:         p.baseMrp      || '',
        baseStock:       p.baseStock    || '',
        weight:          p.weight       || '',
        freeShipping:    p.freeShipping || false,
        shippingCharges: p.shippingCharges || '0',
        metaTitle:       p.metaTitle    || '',
        metaDescription: p.metaDescription || '',
        isActive:        p.isActive,
        isFeatured:      p.isFeatured,
      });
    }).catch(() => { toast.error('Product not found.'); navigate('/vendor/products'); });
  }, [id]);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (idx) => {
    setNewImages((prev)  => prev.filter((_, i) => i !== idx));
    setPreviews((prev)   => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = async (url) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/products/vendor/${id}/image`, { data: { imageUrl: url } });
      setProduct((p) => ({ ...p, images: p.images.filter((img) => img !== url) }));
      toast.success('Image deleted.');
    } catch { toast.error('Failed to delete image.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') fd.append(k, JSON.stringify(v.split(',').map((t) => t.trim()).filter(Boolean)));
        else              fd.append(k, v);
      });
      newImages.forEach((img) => fd.append('images', img));

      await api.patch(`/products/vendor/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product updated!');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/vendor/products')}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold mb-8">Edit Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Existing Images */}
          <Card title="Current Images">
            <div className="grid grid-cols-4 gap-3">
              {product.images?.map((url, i) => (
                <div key={i} className="relative aspect-square bg-neutral-800 rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(url)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity
                               flex items-center justify-center text-red-400">
                    <Trash2 size={18} />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-amber-400 text-neutral-950 rounded px-1 font-bold">Main</span>}
                </div>
              ))}
              <label className="aspect-square bg-neutral-800 border-2 border-dashed border-neutral-700 hover:border-amber-400
                                rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-neutral-500
                                hover:text-amber-400 transition-colors">
                <Upload size={18} />
                <span className="text-xs">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
              </label>
            </div>
            {previews.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-neutral-500 mb-2">New images to upload:</p>
                <div className="grid grid-cols-4 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square bg-neutral-800 rounded-xl overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Basic Info */}
          <Card title="Basic Information">
            <div className="space-y-4">
              <FInput label="Product Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Product name" />
              <FTextarea label="Description *" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={4} />
              <div className="grid grid-cols-2 gap-4">
                <FInput label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
                <FInput label="Sub-Category" value={form.subCategory} onChange={(v) => setForm({ ...form, subCategory: v })} />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <FInput label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="tag1, tag2" />
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing & Stock">
            <div className="grid grid-cols-3 gap-4">
              <FInput label="Sale Price (₹)" type="number" value={form.basePrice} onChange={(v) => setForm({ ...form, basePrice: v })} />
              <FInput label="MRP (₹)"        type="number" value={form.baseMrp}   onChange={(v) => setForm({ ...form, baseMrp: v })} />
              <FInput label="Stock Qty"      type="number" value={form.baseStock} onChange={(v) => setForm({ ...form, baseStock: v })} />
            </div>
          </Card>

          {/* Shipping */}
          <Card title="Shipping">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FInput label="Weight (grams)" type="number" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
              <FInput label="Shipping Charges (₹)" type="number" value={form.shippingCharges} onChange={(v) => setForm({ ...form, shippingCharges: v })} />
            </div>
            <Toggle label="Free Shipping" value={form.freeShipping} onChange={(v) => setForm({ ...form, freeShipping: v })} />
          </Card>

          {/* Visibility */}
          <Card title="Visibility">
            <div className="space-y-3">
              <Toggle label="Product Active (visible to customers)" value={form.isActive}   onChange={(v) => setForm({ ...form, isActive: v })} />
              <Toggle label="Featured Product"                       value={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
            </div>
          </Card>

          <button type="submit" disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-4 rounded-2xl transition-all disabled:opacity-60 text-lg">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

const Card = ({ title, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
    <h3 className="font-semibold text-white mb-4">{title}</h3>
    {children}
  </div>
);

const FInput = ({ label, value, onChange, type = 'text', ...rest }) => (
  <div>
    <label className="block text-sm text-neutral-400 mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors" />
  </div>
);

const FTextarea = ({ label, value, onChange, ...rest }) => (
  <div>
    <label className="block text-sm text-neutral-400 mb-1">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} {...rest}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-amber-400' : 'bg-neutral-700'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
    <span className="text-sm text-neutral-300">{label}</span>
  </label>
);
