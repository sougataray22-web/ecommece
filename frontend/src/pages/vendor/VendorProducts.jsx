import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetch = () => api.get('/products/vendor/mine').then((r) => setProducts(r.data.products || [])).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/vendor/${id}`);
    toast.success('Product deleted.');
    fetch();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{fontFamily:"'DM Sans',sans-serif"}}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Products</h1>
          <Link to="/vendor/products/add" className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus size={15}/> Add Product
          </Link>
        </div>
        {loading ? <Loader /> : products.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><Package size={40} className="mx-auto mb-3"/><p>No products yet.</p></div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center gap-4 p-4">
                <img src={p.images?.[0]} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-800 shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{p.name}</p>
                  <p className="text-amber-400 text-sm">₹{p.effectivePrice?.toLocaleString('en-IN')}</p>
                  <p className="text-neutral-500 text-xs">Stock: {p.totalStock}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/vendor/products/${p._id}/edit`} className="p-2 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"><Edit3 size={16}/></Link>
                  <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
const Loader = () => <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/></div>;
