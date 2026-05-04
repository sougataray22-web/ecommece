import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');

  useEffect(() => {
    setLoading(true);
    const q = status ? '?status=' + status : '';
    api.get('/admin/orders' + q).then((r) => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, [status]);

  const badge = { paid: 'text-green-400 bg-green-400/10 border-green-400/30', pending: 'text-amber-400 bg-amber-400/10 border-amber-400/30', failed: 'text-red-400 bg-red-400/10 border-red-400/30' };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/dashboard" className="text-neutral-500 hover:text-white"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart size={22} className="text-amber-400"/> All Orders</h1>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ' +
                (status === s ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white')}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {loading ? <Loader /> : orders.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><ShoppingCart size={40} className="mx-auto mb-3"/><p>No orders found</p></div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{o.orderNumber}</p>
                  <p className="text-neutral-500 text-sm">{o.customer?.name || o.customer?.email} · {new Date(o.createdAt).toLocaleDateString()}</p>
                  <p className="text-neutral-600 text-xs mt-1">{o.subOrders?.length} vendor(s) · {o.subOrders?.reduce((s, sub) => s + sub.items.length, 0)} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold text-lg">₹{o.grandTotal?.toLocaleString('en-IN')}</p>
                  <span className={'text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ' + (badge[o.paymentStatus] || 'text-neutral-400 border-neutral-700')}>
                    {o.paymentStatus}
                  </span>
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
