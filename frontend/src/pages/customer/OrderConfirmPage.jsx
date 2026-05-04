// ─── OrderConfirmPage.jsx ────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { CheckCircle, XCircle, Loader, Package, ChevronRight } from 'lucide-react';

export function OrderConfirmPage() {
  const [params]  = useSearchParams();
  const orderId   = params.get('order_id');
  const [status,  setStatus]  = useState('loading'); // loading | paid | failed
  const [order,   setOrder]   = useState(null);

  useEffect(() => {
    if (!orderId) return setStatus('failed');
    api.get(`/payment/verify/${orderId}`)
      .then((r) => { setStatus(r.data.paid ? 'paid' : 'failed'); setOrder(r.data.order); })
      .catch(()  => setStatus('failed'));
  }, [orderId]);

  if (status === 'loading') return (
    <Page>
      <div className="flex flex-col items-center gap-4 text-neutral-400">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p>Verifying payment…</p>
      </div>
    </Page>
  );

  if (status === 'failed') return (
    <Page>
      <XCircle size={56} className="text-red-400 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
      <p className="text-neutral-400 mb-8 text-center max-w-sm">
        Your payment could not be processed. Please try again or contact support.
      </p>
      <Link to="/cart" className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-8 py-3 rounded-xl transition-all">
        Back to Cart
      </Link>
    </Page>
  );

  return (
    <Page>
      <CheckCircle size={56} className="text-green-400 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Order Placed! 🎉</h1>
      <p className="text-neutral-400 text-center mb-6 max-w-sm">
        Your order <strong className="text-white">{order?.orderNumber}</strong> has been confirmed.
        You'll receive updates via email.
      </p>
      <div className="bg-neutral-800 rounded-2xl p-5 w-full max-w-sm mb-8 text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-neutral-400">Order Total</span>
          <span className="text-amber-400 font-bold">₹{order?.grandTotal?.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Items</span>
          <span className="text-white">{order?.subOrders?.reduce((s, sub) => s + sub.items.length, 0)}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <Link to={`/orders/${orderId}`}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-6 py-3 rounded-xl transition-all">
          <Package size={16} /> Track Order
        </Link>
        <Link to="/" className="border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-6 py-3 rounded-xl transition-colors">
          Continue Shopping
        </Link>
      </div>
    </Page>
  );
}

const Page = ({ children }) => (
  <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    {children}
  </div>
);

export default OrderConfirmPage;
