import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useCartStore from '../../context/cartStore';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, ArrowLeft, Plus, Minus, Store } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { addItem } = useCartStore();

  const [product,      setProduct]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [mainImage,    setMainImage]    = useState(0);
  const [selectedVars, setSelectedVars] = useState({});  // { color: 'Red', size: 'XL' }
  const [quantity,     setQuantity]     = useState(1);

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data.product);
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (!product) return null;

  // Find matching variation
  const matchedVariation = product.variations?.find((v) =>
    Object.entries(selectedVars).every(([k, val]) => v.attributes?.get?.(k) === val || v.attributes?.[k] === val)
  );

  const price  = matchedVariation ? matchedVariation.price  : product.basePrice;
  const mrp    = matchedVariation ? matchedVariation.mrp    : product.baseMrp;
  const stock  = matchedVariation ? matchedVariation.stock  : product.baseStock;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Collect unique values per axis
  const axisOptions = {};
  product.variationAxes?.forEach((ax) => {
    axisOptions[ax] = [...new Set(product.variations?.map((v) => v.attributes?.[ax]).filter(Boolean))];
  });

  const allAxesSelected = product.variationAxes?.every((ax) => selectedVars[ax]) ?? true;

  const handleAddToCart = () => {
    if (!allAxesSelected) return toast.error('Please select all options.');
    if (stock === 0)       return toast.error('Out of stock.');
    addItem(product, quantity, matchedVariation?.sku || null, selectedVars);
    toast.success('Added to cart!');
  };

  const images = matchedVariation?.images?.length ? matchedVariation.images : product.images;

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/products" className="flex items-center gap-2 text-neutral-500 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Images ─────────────────────────────────────────────────────── */}
          <div>
            <div className="aspect-square bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 mb-3">
              <img src={images?.[mainImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setMainImage(i)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${i === mainImage ? 'border-amber-400' : 'border-neutral-800 hover:border-neutral-600'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ───────────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div>
              {product.brand && <p className="text-neutral-500 text-sm mb-1">{product.brand}</p>}
              <h1 className="text-2xl font-bold text-white leading-tight">{product.name}</h1>

              {product.ratingsCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} fill={s <= Math.round(product.ratingsAverage) ? '#f59e0b' : 'none'}
                        className={s <= Math.round(product.ratingsAverage) ? 'text-amber-400' : 'text-neutral-600'} />
                    ))}
                  </div>
                  <span className="text-neutral-400 text-sm">{product.ratingsAverage?.toFixed(1)} ({product.ratingsCount} reviews)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-amber-400">₹{price?.toLocaleString('en-IN')}</span>
              {mrp > price && (
                <>
                  <span className="text-neutral-500 text-lg line-through">₹{mrp?.toLocaleString('en-IN')}</span>
                  <span className="bg-green-500/20 text-green-400 border border-green-400/30 text-sm font-bold px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Variations */}
            {product.variationAxes?.map((ax) => (
              <div key={ax}>
                <p className="text-sm font-medium text-neutral-300 mb-2 capitalize">{ax}: {selectedVars[ax] && <span className="text-amber-400">{selectedVars[ax]}</span>}</p>
                <div className="flex flex-wrap gap-2">
                  {axisOptions[ax]?.map((val) => (
                    <button key={val} onClick={() => setSelectedVars((s) => ({ ...s, [ax]: val }))}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all
                        ${selectedVars[ax] === val ? 'border-amber-400 bg-amber-400/15 text-amber-400' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`text-sm ${stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock > 0 ? `${stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm text-neutral-400 mb-2">Quantity</p>
              <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 w-fit rounded-xl p-1">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold text-white">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={stock === 0}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-bold py-4 rounded-2xl
                           flex items-center justify-center gap-2 transition-all">
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button onClick={() => { handleAddToCart(); navigate('/checkout'); }}
                disabled={stock === 0}
                className="flex-1 border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-neutral-950 font-bold py-4 rounded-2xl transition-all disabled:opacity-40">
                Buy Now
              </button>
            </div>

            {/* Sold by */}
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <Store size={18} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Sold by</p>
                <p className="text-white text-sm font-medium">{product.vendor?.businessName || product.vendor?.name}</p>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { Icon: Truck,    label: product.freeShipping ? 'Free Delivery' : `₹${product.shippingCharges} Delivery` },
                { Icon: Shield,   label: 'Secure Payments' },
                { Icon: RotateCcw,label: '7-Day Returns' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-center">
                  <Icon size={18} className="text-amber-400" />
                  <span className="text-xs text-neutral-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-4">Product Description</h2>
          <p className="text-neutral-400 leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <Link key={t} to={`/products?search=${t}`}
                className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-400/50 rounded-full px-3 py-1 transition-colors">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Loading = () => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
