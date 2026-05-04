import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { Plus, X, Upload, Trash2, ArrowLeft } from 'lucide-react';

export default function VendorAddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [images,     setImages]     = useState([]);  // File objects
  const [previews,   setPreviews]   = useState([]);  // Preview URLs

  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: '',
    subCategory: '', tags: '',
    basePrice: '', baseMrp: '', baseStock: '',
    weight: '', freeShipping: false, shippingCharges: '0',
    metaTitle: '', metaDescription: '',
    variationAxes: [],  // e.g. ['color', 'size']
    variations: [],     // [{sku, attributes, price, mrp, stock}]
  });

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) return toast.error('Max 8 images allowed.');
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImages((prev)   => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Variation helpers ────────────────────────────────────────────────────
  const addAxis = () => {
    const axis = prompt('Enter variation type (e.g. color, size, ram):');
    if (axis && !form.variationAxes.includes(axis.toLowerCase())) {
      setForm((f) => ({ ...f, variationAxes: [...f.variationAxes, axis.toLowerCase()] }));
    }
  };

  const addVariation = () => {
    const attrs = {};
    form.variationAxes.forEach((ax) => { attrs[ax] = ''; });
    setForm((f) => ({
      ...f,
      variations: [...f.variations, { sku: `SKU-${Date.now()}`, attributes: attrs, price: '', mrp: '', stock: '' }],
    }));
  };

  const updateVariation = (idx, key, value) => {
    setForm((f) => {
      const vars = [...f.variations];
      if (key.startsWith('attr_')) {
        const axisKey = key.replace('attr_', '');
        vars[idx] = { ...vars[idx], attributes: { ...vars[idx].attributes, [axisKey]: value } };
      } else {
        vars[idx] = { ...vars[idx], [key]: value };
      }
      return { ...f, variations: vars };
    });
  };

  const removeVariation = (idx) =>
    setForm((f) => ({ ...f, variations: f.variations.filter((_, i) => i !== idx) }));

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return toast.error('Upload at least one product image.');
    if (!form.name.trim())   return toast.error('Product name is required.');
    if (!form.category)      return toast.error('Select a category.');

    const hasVariations = form.variations.length > 0;
    if (!hasVariations && !form.basePrice) return toast.error('Enter base price.');

    setSaving(true);
    try {
      const fd = new FormData();
      images.forEach((img) => fd.append('images', img));

      const fields = { ...form };
      fd.append('name',        fields.name);
      fd.append('description', fields.description);
      fd.append('brand',       fields.brand);
      fd.append('category',    fields.category);
      fd.append('subCategory', fields.subCategory);
      fd.append('tags',        JSON.stringify(fields.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      fd.append('basePrice',   fields.basePrice || 0);
      fd.append('baseMrp',     fields.baseMrp   || 0);
      fd.append('baseStock',   fields.baseStock  || 0);
      fd.append('weight',      fields.weight     || 0);
      fd.append('freeShipping',   fields.freeShipping);
      fd.append('shippingCharges',fields.shippingCharges || 0);
      fd.append('metaTitle',   fields.metaTitle);
      fd.append('metaDescription', fields.metaDescription);
      fd.append('variationAxes', JSON.stringify(fields.variationAxes));
      fd.append('variations',    JSON.stringify(fields.variations));

      await api.post('/products/vendor', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product created!');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/vendor/products')}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Images ─────────────────────────────────────────────────────── */}
          <Card title="Product Images *">
            <div className="grid grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square bg-neutral-800 rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white">
                    <X size={12} />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-amber-400 text-neutral-950 rounded px-1 font-bold">Main</span>}
                </div>
              ))}
              {previews.length < 8 && (
                <label className="aspect-square bg-neutral-800 border-2 border-dashed border-neutral-700 hover:border-amber-400
                                  rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer text-neutral-500
                                  hover:text-amber-400 transition-colors">
                  <Upload size={20} />
                  <span className="text-xs">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-2">First image is main. Max 8 images, 5MB each.</p>
          </Card>

          {/* ── Basic Info ─────────────────────────────────────────────────── */}
          <Card title="Basic Information">
            <div className="space-y-4">
              <FInput label="Product Name *" value={form.name}        onChange={(v) => setForm({...form, name: v})}        placeholder="Enter product name" />
              <FTextarea label="Description *" value={form.description} onChange={(v) => setForm({...form, description: v})} placeholder="Detailed product description" rows={4} />
              <div className="grid grid-cols-2 gap-4">
                <FInput label="Brand"       value={form.brand}       onChange={(v) => setForm({...form, brand: v})}       placeholder="Brand name" />
                <FInput label="Sub-Category" value={form.subCategory} onChange={(v) => setForm({...form, subCategory: v})} placeholder="e.g. Laptops" />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <FInput label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({...form, tags: v})} placeholder="electronics, mobile, samsung" />
            </div>
          </Card>

          {/* ── Pricing & Stock (only if no variations) ─────────────────── */}
          {form.variations.length === 0 && (
            <Card title="Pricing & Stock">
              <div className="grid grid-cols-3 gap-4">
                <FInput label="Sale Price (₹) *" type="number" value={form.basePrice} onChange={(v) => setForm({...form, basePrice: v})} placeholder="999" />
                <FInput label="MRP (₹)"          type="number" value={form.baseMrp}   onChange={(v) => setForm({...form, baseMrp: v})}   placeholder="1499" />
                <FInput label="Stock Qty *"      type="number" value={form.baseStock} onChange={(v) => setForm({...form, baseStock: v})} placeholder="100" />
              </div>
            </Card>
          )}

          {/* ── Variations ─────────────────────────────────────────────────── */}
          <Card title="Product Variations (optional)">
            {form.variationAxes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {form.variationAxes.map((ax) => (
                  <div key={ax} className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/30 rounded-full px-3 py-1 text-amber-400 text-sm">
                    {ax}
                    <button type="button" onClick={() => setForm((f) => ({ ...f, variationAxes: f.variationAxes.filter((a) => a !== ax) }))}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <button type="button" onClick={addAxis}
                className="flex items-center gap-2 border border-neutral-700 hover:border-amber-400 text-neutral-400 hover:text-amber-400
                           rounded-xl px-4 py-2 text-sm transition-colors">
                <Plus size={14} /> Add Variation Type
              </button>
              {form.variationAxes.length > 0 && (
                <button type="button" onClick={addVariation}
                  className="flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-400 rounded-xl px-4 py-2 text-sm hover:bg-amber-400/25 transition-colors">
                  <Plus size={14} /> Add SKU
                </button>
              )}
            </div>

            {form.variations.map((v, idx) => (
              <div key={idx} className="bg-neutral-800 rounded-xl p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-300">SKU {idx + 1}</span>
                  <button type="button" onClick={() => removeVariation(idx)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
                <FInput label="SKU Code" value={v.sku} onChange={(val) => updateVariation(idx, 'sku', val)} placeholder="SKU-001" />
                <div className="grid grid-cols-2 gap-3">
                  {form.variationAxes.map((ax) => (
                    <FInput key={ax} label={ax.charAt(0).toUpperCase() + ax.slice(1)}
                      value={v.attributes[ax] || ''}
                      onChange={(val) => updateVariation(idx, `attr_${ax}`, val)}
                      placeholder={`e.g. ${ax === 'color' ? 'Red' : ax === 'size' ? 'XL' : '128GB'}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FInput label="Price (₹) *" type="number" value={v.price} onChange={(val) => updateVariation(idx, 'price', val)} placeholder="999" />
                  <FInput label="MRP (₹)"     type="number" value={v.mrp}   onChange={(val) => updateVariation(idx, 'mrp',   val)} placeholder="1499" />
                  <FInput label="Stock"        type="number" value={v.stock} onChange={(val) => updateVariation(idx, 'stock', val)} placeholder="50" />
                </div>
              </div>
            ))}
          </Card>

          {/* ── Shipping ───────────────────────────────────────────────────── */}
          <Card title="Shipping">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FInput label="Weight (grams)" type="number" value={form.weight} onChange={(v) => setForm({...form, weight: v})} placeholder="500" />
              <FInput label="Shipping Charges (₹)" type="number" value={form.shippingCharges} onChange={(v) => setForm({...form, shippingCharges: v})} placeholder="0" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm({...form, freeShipping: !form.freeShipping})}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.freeShipping ? 'bg-amber-400' : 'bg-neutral-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.freeShipping ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-neutral-300">Free Shipping</span>
            </label>
          </Card>

          {/* ── SEO ────────────────────────────────────────────────────────── */}
          <Card title="SEO (optional)">
            <div className="space-y-3">
              <FInput label="Meta Title" value={form.metaTitle} onChange={(v) => setForm({...form, metaTitle: v})} placeholder="SEO title" />
              <FTextarea label="Meta Description" value={form.metaDescription} onChange={(v) => setForm({...form, metaDescription: v})} placeholder="SEO description" rows={2} />
            </div>
          </Card>

          <button type="submit" disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-4 rounded-2xl
                       text-lg transition-all disabled:opacity-60">
            {saving ? 'Creating Product…' : 'Create Product'}
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
