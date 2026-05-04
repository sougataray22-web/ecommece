// ─────────────────────────────────────────────────────────────────────────────
// Shared layout + reusable shell for pages not yet fully built
// Each file must export a default component.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useCartStore from '../../context/cartStore';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Trash2, Plus, Minus, Package, ChevronRight, User, MapPin, ArrowLeft } from 'lucide-react';

// ═════════════════════════════════════════════════════════════════════════════
// CART PAGE
// ═════════════════════════════════════════════════════════════════════════════
export function CartPage() {
  const { items, removeItem, updateQty, total, itemCount } = useCartStore();
  const navigate = useNavigate();
  const shipping = total() > 499 ? 0 : 49;
  const tax      = Math.round(total() * 0.18);

  if (items.length === 0) return (
    <Shell>
      <div className="flex flex-col items-center py-24 text-neutral-500">
        <ShoppingCart size={48} className="mb-4 text-neutral-700" />
        <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
        <p className="text-sm mb-6">Add some products to get started</p>
        <Link to="/" className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-6 py-3 rounded-xl transition-all">
          Shop Now
        </Link>
      </div>
    </Shell>
  );

  return (
    <Shell title="Shopping Cart">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-neutral-800 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="text-white font-medium text-sm hover:text-amber-400 transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <p className="text-neutral-500 text-xs mt-1">{item.vendorName}</p>
                <p className="text-amber-400 font-semibold mt-2">₹{item.unitPrice?.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => removeItem(item.key)} className="text-neutral-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
                <div className="flex items-center gap-2 bg-neutral-800 rounded-xl p-1">
                  <button onClick={() => updateQty(item.key, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.key, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
                    <Plus size={13} />
                  </button>
                </div>
                <p className="text-white text-sm font-semibold">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-fit sticky top-24">
          <h2 className="font-semibold text-white mb-5">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <Row2 l="Subtotal"  v={`₹${total().toLocaleString('en-IN')}`} />
            <Row2 l="Shipping"  v={shipping === 0 ? 'FREE' : `₹${shipping}`} vc={shipping === 0 ? 'text-green-400' : 'text-white'} />
            <Row2 l="GST (18%)" v={`₹${tax.toLocaleString('en-IN')}`} />
            <div className="border-t border-neutral-800 pt-3 flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-amber-400">₹{(total() + shipping + tax).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')}
            className="w-full mt-5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-3 rounded-xl
                       flex items-center justify-center gap-2 transition-all">
            Checkout <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Shell>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="My Orders">
      {loading ? <Loader /> : orders.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <Package size={40} className="mx-auto mb-3 text-neutral-700" />
          <p>No orders yet.</p>
          <Link to="/" className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`}
              className="block bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{o.orderNumber}</p>
                  <p className="text-neutral-500 text-xs mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">₹{o.grandTotal?.toLocaleString('en-IN')}</p>
                  <StatusChip s={o.status} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {o.subOrders?.slice(0,3).flatMap((sub) => sub.items).slice(0,4).map((item, i) => (
                  <img key={i} src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-800" />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ORDER DETAIL PAGE
// ═════════════════════════════════════════════════════════════════════════════
export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data.order)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Shell><Loader /></Shell>;
  if (!order)  return <Shell><p className="text-neutral-400">Order not found.</p></Shell>;

  return (
    <Shell title={`Order ${order.orderNumber}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {order.subOrders?.map((sub, si) => (
            <div key={si} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-neutral-300">Vendor: {sub.vendor?.businessName || sub.vendor?.name}</p>
                <StatusChip s={sub.status} />
              </div>
              {sub.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-4 py-3 border-t border-neutral-800">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-neutral-800 shrink-0" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-neutral-500 text-xs">Qty: {item.quantity} × ₹{item.unitPrice?.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-amber-400 font-semibold text-sm">₹{item.totalPrice?.toLocaleString('en-IN')}</p>
                </div>
              ))}
              {sub.trackingNumber && (
                <div className="mt-3 p-3 bg-neutral-800 rounded-xl text-sm">
                  <span className="text-neutral-400">Tracking: </span>
                  <span className="text-white font-medium">{sub.trackingNumber}</span>
                  {sub.shippingPartner && <span className="text-neutral-500"> via {sub.shippingPartner}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-sm">
            <h3 className="font-semibold text-white mb-4">Price Details</h3>
            <Row2 l="Items"    v={`₹${order.itemsTotal?.toLocaleString('en-IN')}`} />
            <Row2 l="Shipping" v={order.shippingTotal === 0 ? 'FREE' : `₹${order.shippingTotal}`} />
            <Row2 l="Tax"      v={`₹${order.taxTotal?.toLocaleString('en-IN')}`} />
            <div className="border-t border-neutral-800 pt-3 flex justify-between mt-3">
              <span className="font-bold text-white">Total Paid</span>
              <span className="font-bold text-amber-400">₹{order.grandTotal?.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${order.paymentStatus === 'paid' ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-sm">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><MapPin size={14}/> Delivery Address</h3>
            <p className="text-white">{order.shippingAddress?.name}</p>
            <p className="text-neutral-400">{order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
            <p className="text-neutral-400">{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
  const [me, setMe] = useState(null);
  useEffect(() => { api.get('/auth/me').then((r) => setMe(r.data.user)); }, []);
  return (
    <Shell title="My Profile">
      {!me ? <Loader /> : (
        <div className="max-w-lg space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-400/20 rounded-2xl flex items-center justify-center">
              <User size={28} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{me.name || 'Set your name'}</p>
              <p className="text-neutral-400 text-sm">{me.email || me.phone}</p>
              <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-full px-2 py-0.5 capitalize mt-1 inline-block">{me.role}</span>
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-sm space-y-2">
            <Row2 l="Email"  v={me.email || '—'} />
            <Row2 l="Phone"  v={me.phone || '—'} />
            <Row2 l="Member since" v={new Date(me.createdAt).toLocaleDateString()} />
          </div>
          <Link to="/orders" className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors">
            <span className="text-white text-sm font-medium flex items-center gap-2"><Package size={16}/> My Orders</span>
            <ChevronRight size={16} className="text-neutral-500" />
          </Link>
        </div>
      )}
    </Shell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Shell = ({ title, children }) => (
  <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div className="max-w-5xl mx-auto">
      {title && (
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-neutral-500 hover:text-white transition-colors"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      )}
      {children}
    </div>
  </div>
);

const Row2 = ({ l, v, vc = 'text-white' }) => (
  <div className="flex justify-between py-1.5 border-b border-neutral-800 last:border-0">
    <span className="text-neutral-400">{l}</span>
    <span className={vc}>{v}</span>
  </div>
);

const StatusChip = ({ s }) => {
  const map = {
    delivered: 'text-green-400 bg-green-400/10 border-green-400/30',
    shipped:   'text-blue-400  bg-blue-400/10  border-blue-400/30',
    confirmed: 'text-sky-400   bg-sky-400/10   border-sky-400/30',
    pending:   'text-amber-400 bg-amber-400/10 border-amber-400/30',
    cancelled: 'text-red-400   bg-red-400/10   border-red-400/30',
    paid:      'text-green-400 bg-green-400/10 border-green-400/30',
    failed:    'text-red-400   bg-red-400/10   border-red-400/30',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${map[s] || 'text-neutral-400 border-neutral-700'}`}>{s}</span>;
};

const Loader = () => (
  <div className="flex justify-center items-center h-40">
    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
