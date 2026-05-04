import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import useCartStore from '../../context/cartStore';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Heart, Search, User, Store, Menu, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function HomePage() {
  const [banners,   setBanners]   = useState([]);
  const [products,  setProducts]  = useState([]);
  const [featured,  setFeatured]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const { user, logout, isAuthenticated } = useAuthStore();
  const { addItem, itemCount }            = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/banners'),
      api.get('/products?limit=12&sort=-createdAt'),
      api.get('/products?featured=true&limit=6'),
    ]).then(([b, p, f]) => {
      setBanners(b.data.banners  || []);
      setProducts(p.data.products || []);
      setFeatured(f.data.products || []);
    });
  }, []);

  // Auto-advance banner
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners]);

  const handleBannerClick = (banner) => {
    if (banner.targetType === 'url' && banner.targetUrl) window.open(banner.targetUrl, '_blank');
    if (banner.targetType === 'product'  && banner.targetId) navigate(`/products/${banner.targetId}`);
    if (banner.targetType === 'category' && banner.targetId) navigate(`/products?category=${banner.targetId}`);
  };

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <Store size={16} className="text-neutral-950" />
            </div>
            <span className="font-bold text-white hidden sm:block">{process.env.REACT_APP_STORE_NAME || 'YourStore'}</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
            <div className="flex bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden focus-within:border-amber-400 transition-colors">
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
              <button type="submit" className="px-4 text-neutral-400 hover:text-amber-400 transition-colors">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right nav */}
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/cart" className="relative p-2 text-neutral-400 hover:text-amber-400 transition-colors">
              <ShoppingCart size={20} />
              {itemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-neutral-950 text-xs font-bold
                                 rounded-full flex items-center justify-center">
                  {itemCount()}
                </span>
              )}
            </Link>

            {isAuthenticated() ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors">
                  <User size={20} />
                  <span className="text-sm hidden sm:block">{user?.name?.split(' ')[0] || 'Account'}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {user?.role === 'owner'  && <Link to="/admin/dashboard"  className="block px-4 py-3 text-sm text-neutral-300 hover:text-amber-400 hover:bg-neutral-800">Admin Panel</Link>}
                  {user?.role === 'vendor' && <Link to="/vendor/dashboard" className="block px-4 py-3 text-sm text-neutral-300 hover:text-amber-400 hover:bg-neutral-800">Vendor Panel</Link>}
                  <Link to="/orders"  className="block px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800">My Orders</Link>
                  <Link to="/profile" className="block px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800">Profile</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-400/10">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login"
                className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Banner Slider ────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="relative h-[280px] sm:h-[380px] lg:h-[480px] overflow-hidden bg-neutral-900">
          {banners.map((b, i) => (
            <div
              key={b._id}
              onClick={() => handleBannerClick(b)}
              className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIdx ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
            >
              <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-16">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white max-w-lg leading-tight">{b.title}</h2>
                {b.subtitle && <p className="text-neutral-300 mt-3 text-sm sm:text-lg max-w-md">{b.subtitle}</p>}
                {b.targetType !== 'none' && (
                  <button className="mt-6 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-6 py-3 rounded-xl
                                     text-sm sm:text-base w-fit transition-all">
                    Shop Now
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Prev/Next */}
          {banners.length > 1 && (
            <>
              <button onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full
                           flex items-center justify-center text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setBannerIdx((i) => (i + 1) % banners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full
                           flex items-center justify-center text-white transition-colors">
                <ChevronRight size={20} />
              </button>
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setBannerIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <SectionHeader title="⭐ Featured" href="/products?featured=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featured.map((p) => <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />)}
          </div>
        </section>
      )}

      {/* ── Latest Products ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12 pt-0">
        <SectionHeader title="🆕 Latest Products" href="/products" />
        {products.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <Store size={40} className="mx-auto mb-3" />
            <p>No products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />)}
          </div>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-neutral-900 border-t border-neutral-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center text-neutral-500 text-sm">
          <p className="font-bold text-white text-lg mb-2">{process.env.REACT_APP_STORE_NAME || 'YourStore'}</p>
          <p>Multi-Vendor Marketplace · Secured Payments · Fast Delivery</p>
          <p className="mt-4">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, href }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold text-white">{title}</h2>
    <Link to={href} className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
      View All →
    </Link>
  </div>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAddToCart }) => {
  const discount = product.baseMrp && product.basePrice
    ? Math.round(((product.baseMrp - product.basePrice) / product.baseMrp) * 100)
    : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700
                    hover:-translate-y-1 transition-all duration-200 group">
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
          className="absolute bottom-2 right-2 w-9 h-9 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl
                     flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
          <ShoppingCart size={16} />
        </button>
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link to={`/products/${product.slug}`}>
          <h3 className="text-white text-sm font-medium line-clamp-2 mb-1 hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-neutral-500 text-xs mb-2">{product.vendor?.businessName || product.vendor?.name}</p>

        {/* Rating */}
        {product.ratingsCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} fill="#f59e0b" className="text-amber-400" />
            <span className="text-xs text-neutral-400">{product.ratingsAverage?.toFixed(1)} ({product.ratingsCount})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-amber-400 font-bold">₹{product.effectivePrice?.toLocaleString('en-IN')}</span>
          {product.baseMrp > product.basePrice && (
            <span className="text-neutral-600 text-xs line-through">₹{product.baseMrp?.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  );
};
