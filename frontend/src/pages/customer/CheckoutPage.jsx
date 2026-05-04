import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useCartStore from '../../context/cartStore';
import useAuthStore from '../../context/authStore';
import { MapPin, CreditCard, ShoppingBag, ChevronRight, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const { user }  = useAuthStore();

  const [addresses,   setAddresses]   = useState(user?.addresses || []);
  const [selectedAddr,setSelectedAddr]= useState(0);
  const [showNewAddr, setShowNewAddr] = useState(addresses.length === 0);
  const [newAddr,     setNewAddr]     = useState({ label: 'Home', name: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [placing,     setPlacing]     = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items]);

  const shippingCost = total() > 499 ? 0 : 49;
  const tax          = Math.round(total() * 0.18);
  const grandTotal   = total() + shippingCost + tax;

  const handlePlaceOrder = async () => {
    const addr = showNewAddr ? newAddr : addresses[selectedAddr];
    if (!addr) return toast.error('Please add a shipping address.');
    if (!addr.name || !addr.phone || !addr.line1 || !addr.city || !addr.pincode)
      return toast.error('Fill all required address fields.');

    setPlacing(true);
    try {
      // 1. Create order
      const orderRes = await api.post('/orders', {
        items: items.map((i) => ({
          productId:    i.productId,
          variationSku: i.variationSku || undefined,
          quantity:     i.quantity,
        })),
        shippingAddress: addr,
      });
      const order = orderRes.data.order;

      // 2. Create Cashfree session
      const sessionRes = await api.post('/payment/create-session', { orderId: order._id });
      const { paymentSessionId } = sessionRes.data;

      // 3. Load Cashfree JS SDK and open checkout
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree  = await load({ mode: process.env.REACT_APP_CASHFREE_MODE || 'production' });

      cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_self',
      });

      // Cart is cleared after webhook confirms payment (or on verify)
      clearCart();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <ShoppingBag size={22} className="text-amber-400" /> Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Address ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-amber-400" /> Delivery Address
              </h2>

              {/* Saved addresses */}
              {addresses.length > 0 && !showNewAddr && (
                <div className="space-y-3 mb-4">
                  {addresses.map((a, i) => (
                    <label key={i}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors
                        ${selectedAddr === i ? 'border-amber-400 bg-amber-400/5' : 'border-neutral-700 hover:border-neutral-600'}`}>
                      <input type="radio" name="addr" checked={selectedAddr === i}
                        onChange={() => setSelectedAddr(i)} className="mt-1 accent-amber-400" />
                      <div>
                        <p className="font-medium text-white">{a.name} · {a.phone}</p>
                        <p className="text-neutral-400 text-sm">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                        <p className="text-neutral-400 text-sm">{a.city}, {a.state} – {a.pincode}</p>
                        <span className="text-xs bg-neutral-800 text-neutral-400 rounded px-2 py-0.5 mt-1 inline-block">{a.label}</span>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setShowNewAddr(true)}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition-colors mt-2">
                    <Plus size={14} /> Add New Address
                  </button>
                </div>
              )}

              {/* New address form */}
              {showNewAddr && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <button onClick={() => setShowNewAddr(false)}
                      className="text-neutral-400 hover:text-white text-sm transition-colors">← Use saved address</button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <AI label="Label" value={newAddr.label} onChange={(v) => setNewAddr({...newAddr, label: v})}
                        placeholder="Home / Office" />
                    <AI label="Full Name *" value={newAddr.name} onChange={(v) => setNewAddr({...newAddr, name: v})}
                        placeholder="Receiver name" />
                  </div>
                  <AI label="Phone *" value={newAddr.phone} onChange={(v) => setNewAddr({...newAddr, phone: v})}
                      placeholder="+91 98765 43210" />
                  <AI label="Address Line 1 *" value={newAddr.line1} onChange={(v) => setNewAddr({...newAddr, line1: v})}
                      placeholder="House No., Street" />
                  <AI label="Address Line 2" value={newAddr.line2} onChange={(v) => setNewAddr({...newAddr, line2: v})}
                      placeholder="Landmark, Area" />
                  <div className="grid grid-cols-3 gap-4">
                    <AI label="City *"    value={newAddr.city}    onChange={(v) => setNewAddr({...newAddr, city: v})}    placeholder="City" />
                    <AI label="State *"   value={newAddr.state}   onChange={(v) => setNewAddr({...newAddr, state: v})}   placeholder="State" />
                    <AI label="Pincode *" value={newAddr.pincode} onChange={(v) => setNewAddr({...newAddr, pincode: v})} placeholder="110001" />
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Order Items ({items.length})</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.key} className="flex items-center gap-4">
                    <img src={item.image} alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-neutral-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-neutral-500 text-xs">{item.vendorName}</p>
                      {item.variationSku && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(item.attributes || {}).map(([k, v]) => (
                            <span key={k} className="text-xs bg-neutral-800 text-neutral-400 rounded px-2 py-0.5">{k}: {v}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-neutral-400 text-xs mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-amber-400 font-semibold shrink-0">
                      ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Summary ────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sticky top-24">
              <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-400" /> Price Summary
              </h2>

              <div className="space-y-3 text-sm">
                <SummaryRow label="Items total"   value={`₹${total().toLocaleString('en-IN')}`} />
                <SummaryRow label="Shipping"      value={shippingCost === 0 ? 'FREE' : `₹${shippingCost}`} valueColor={shippingCost === 0 ? 'text-green-400' : undefined} />
                <SummaryRow label="GST (18%)"     value={`₹${tax.toLocaleString('en-IN')}`} />
                <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-amber-400 text-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full mt-6 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-4 rounded-xl
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm">
                {placing ? 'Processing…' : <>Pay ₹{grandTotal.toLocaleString('en-IN')} <ChevronRight size={16} /></>}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <span>🔒</span>
                <span>Secured by Cashfree Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AI = ({ label, value, onChange, ...rest }) => (
  <div>
    <label className="block text-xs text-neutral-400 mb-1">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} {...rest}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors" />
  </div>
);

const SummaryRow = ({ label, value, valueColor = 'text-white' }) => (
  <div className="flex items-center justify-between">
    <span className="text-neutral-400">{label}</span>
    <span className={valueColor}>{value}</span>
  </div>
);
