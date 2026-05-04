import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VendorOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/orders').then((r) => setOrders(r.data.orders || [])).finally(() => setLoading(false)); }, []);
  const updateStatus = async (orderId, subId, status) => {
    try {
      await api.patch(`/orders/${orderId}/sub/${subId}`, { status });
      toast.success('Status updated.');
      setOrders((prev) => prev.map((o) => ({
        ...o,
        subOrders: o.subOrders?.map((s) => s._id === subId ? { ...s, status } : s),
      })));
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{fontFamily:"'DM Sans',sans-serif"}}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Orders</h1>
        {loading ? <Loader /> : orders.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><ShoppingCart size={40} className="mx-auto mb-3"/><p>No orders yet.</p></div>
        ) : orders.map((o) => (
          <div key={o._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
            <div className="flex justify-between mb-3">
              <p className="font-semibold text-white">{o.orderNumber}</p>
              <p className="text-amber-400 font-bold">₹{o.grandTotal?.toLocaleString('en-IN')}</p>
            </div>
            {o.subOrders?.map((sub) => (
              <div key={sub._id} className="border-t border-neutral-800 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-300">{sub.items.length} item(s)</p>
                  <select value={sub.status} onChange={(e) => updateStatus(o._id, sub._id, e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400">
                    {['pending','confirmed','processing','shipped','delivered','cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
const Loader = () => <div className="flex justify-center h-40 items-center"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"/></div>;
