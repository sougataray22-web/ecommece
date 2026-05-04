import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import useCartStore from '../../context/cartStore';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Search, SlidersHorizontal, Star, ArrowLeft } from 'lucide-react';

export default function ProductListPage() {
  const [params]   = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const { addItem } = useCartStore();

  const search   = params.get('search')   || '';
  const category = params.get('category') || '';
  const featured = params.get('featured') || '';

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 20 });
    if (search)   q.set('search',   search);
    if (category) q.set('category', category);
    if (featured) q.set('featured', featured);
    api.get(`/products?${q}`).then((r) => {
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  }, [page, search, category, featured]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-neutral-500 hover:text-white transition-colors"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold">
            {search ? `Results for "${search}"` : featured ? 'Featured Products' : 'All Products'}
          </h1>
          <span className="text-neutral-500 text-sm">({total} items)</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-neutral-500">
            <Search size={40} className="mx-auto mb-3 text-neutral-700" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => {
              const discount = p.baseMrp > p.basePrice
                ? Math.round(((p.baseMrp - p.basePrice) / p.baseMrp) * 100) : 0;
              return (
                <div key={p._id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-neutral-700 transition-all duration-200 group">
                  <Link to={`/products/${p.slug}`} className="block relative overflow-hidden">
                    <img src={p.images?.[0]} alt={p.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                    {discount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
                    <button onClick={(e) => { e.preventDefault(); addItem(p); toast.success(`${p.name} added!`); }}
                      className="absolute bottom-2 right-2 w-9 h-9 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                      <ShoppingCart size={15} />
                    </button>
                  </Link>
                  <div className="p-3">
                    <Link to={`/products/${p.slug}`}>
                      <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 hover:text-amber-400 transition-colors">{p.name}</h3>
                    </Link>
                    <p className="text-neutral-500 text-xs mb-2">{p.vendor?.businessName || p.vendor?.name}</p>
                    {p.ratingsCount > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star size={11} fill="#f59e0b" className="text-amber-400" />
                        <span className="text-xs text-neutral-400">{p.ratingsAverage?.toFixed(1)} ({p.ratingsCount})</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-amber-400 font-bold text-sm">₹{p.effectivePrice?.toLocaleString('en-IN')}</span>
                      {p.baseMrp > p.basePrice && <span className="text-neutral-600 text-xs line-through">₹{p.baseMrp?.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-10">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl border border-neutral-700 text-neutral-400 disabled:opacity-40 hover:border-amber-400 hover:text-amber-400 transition-colors text-sm">
              ← Prev
            </button>
            <span className="px-4 py-2 text-neutral-400 text-sm">Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-neutral-700 text-neutral-400 disabled:opacity-40 hover:border-amber-400 hover:text-amber-400 transition-colors text-sm">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
