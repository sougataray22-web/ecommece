import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Package, Trash2, ArrowLeft } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchProducts = () => {
    api.get('/admin/products').then((r) => setProducts(r.data.products || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete('/products/admin/' + id);
      toast.success('Product deleted.');
      fetchProducts();
    } catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/dashboard" className="text-neutral-500 hover:text-white"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package size={22} className="text-amber-400"/> All Products</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-4">{products.length} products</p>
        {loading ? <Loader /> : products.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><Package size={40} className="mx-auto mb-3"/><p>No products</p></div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p._id} className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <img src={p.images?.[0]} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-neutral-800 shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{p.name}</p>
                  <p className="text-neutral-500 text-xs">{p.vendor?.businessName || p.vendor?.name} · {p.category?.name}</p>
                  <p className="text-amber-400 text-sm mt-1">₹{p.effectivePrice?.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={'text-xs px-2 py-0.5 rounded-full border ' + (p.isActive ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-red-400 bg-red-400/10 border-red-400/30')}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Loader = () => (
  <div className="flex justify-center items-center h-40">
    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/>
  </div>
);
