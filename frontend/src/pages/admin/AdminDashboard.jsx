import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart,
  IndianRupee, FileCheck, Image, LogOut, TrendingUp,
  ClipboardList, ChevronRight, AlertCircle
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  path: '/admin/dashboard', Icon: LayoutDashboard },
  { label: 'KYC Review', path: '/admin/kyc',        Icon: FileCheck },
  { label: 'Vendors',    path: '/admin/vendors',    Icon: Store },
  { label: 'Products',   path: '/admin/products',   Icon: Package },
  { label: 'Orders',     path: '/admin/orders',     Icon: ShoppingCart },
  { label: 'Banners',    path: '/admin/banners',    Icon: Image },
];

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [stats,    setStats]   = useState(null);
  const [kycs,     setKycs]    = useState([]);
  const [orders,   setOrders]  = useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/kyc/all?status=pending&limit=5'),
      api.get('/admin/orders?limit=5'),
    ]).then(([s, k, o]) => {
      setStats(s.data.stats);
      setKycs(k.data.kycs || []);
      setOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 hidden lg:flex">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center">
              <Store size={18} className="text-neutral-950" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{process.env.REACT_APP_STORE_NAME || 'YourStore'}</p>
              <p className="text-amber-400 text-xs font-medium">Master Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ label, path, Icon }) => (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white
                         hover:bg-neutral-800 transition-all group">
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'Owner'}</p>
            <p className="text-neutral-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut size={16} /> <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={20} className="text-amber-400" /> Master Control Panel
          </h1>
          <span className="text-xs bg-amber-400/15 text-amber-400 border border-amber-400/30 rounded-full px-3 py-1 font-medium">
            Owner Access
          </span>
        </div>

        <div className="p-6 lg:p-8">
          {loading ? <Loader /> : (
            <>
              {/* ── Stat Cards ─────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Total Revenue"  value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`} Icon={IndianRupee} color="amber" />
                <StatCard label="Orders"         value={stats?.orders     || 0} Icon={ShoppingCart} color="blue" />
                <StatCard label="Products"       value={stats?.products   || 0} Icon={Package}      color="purple" />
                <StatCard label="Vendors"        value={stats?.vendors    || 0} Icon={Store}        color="green" />
                <StatCard label="Customers"      value={stats?.customers  || 0} Icon={Users}        color="pink" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Pending KYCs ─────────────────────────────────────── */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <FileCheck size={16} className="text-amber-400" /> Pending KYC Requests
                    </h2>
                    <Link to="/admin/kyc" className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1">
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="divide-y divide-neutral-800">
                    {kycs.length === 0 ? (
                      <div className="px-6 py-8 text-center text-neutral-500 text-sm">
                        <AlertCircle size={24} className="mx-auto mb-2 text-neutral-700" />
                        No pending KYC requests
                      </div>
                    ) : kycs.map((k) => (
                      <Link key={k._id} to={`/admin/kyc/${k._id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-neutral-800/50 transition-colors">
                        <div>
                          <p className="text-white text-sm font-medium">{k.businessName}</p>
                          <p className="text-neutral-500 text-xs">{k.vendor?.email || k.vendor?.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-amber-400/15 text-amber-400 border border-amber-400/30 rounded-full px-2 py-0.5">
                            Pending
                          </span>
                          <ChevronRight size={14} className="text-neutral-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* ── Recent Orders ─────────────────────────────────────── */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <ClipboardList size={16} className="text-amber-400" /> Recent Orders
                    </h2>
                    <Link to="/admin/orders" className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1">
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                  <div className="divide-y divide-neutral-800">
                    {orders.length === 0 ? (
                      <div className="px-6 py-8 text-center text-neutral-500 text-sm">
                        <ShoppingCart size={24} className="mx-auto mb-2 text-neutral-700" />
                        No orders yet
                      </div>
                    ) : orders.map((o) => (
                      <div key={o._id} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="text-white text-sm font-medium">{o.orderNumber}</p>
                          <p className="text-neutral-500 text-xs">{o.customer?.name || o.customer?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-semibold text-sm">₹{o.grandTotal?.toLocaleString('en-IN')}</p>
                          <StatusBadge status={o.paymentStatus} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Quick Links ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                {NAV.map(({ label, path, Icon }) => (
                  <Link key={path} to={path}
                    className="bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 rounded-2xl p-5
                               flex flex-col items-center gap-3 text-neutral-400 hover:text-amber-400 transition-all group">
                    <Icon size={22} />
                    <span className="text-xs font-medium text-center">{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const colorMap = {
  amber:  { bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  text: 'text-amber-400'  },
  blue:   { bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   text: 'text-blue-400'   },
  purple: { bg: 'bg-purple-400/10', border: 'border-purple-400/20', text: 'text-purple-400' },
  green:  { bg: 'bg-green-400/10',  border: 'border-green-400/20',  text: 'text-green-400'  },
  pink:   { bg: 'bg-pink-400/10',   border: 'border-pink-400/20',   text: 'text-pink-400'   },
};

const StatCard = ({ label, value, Icon, color }) => {
  const c = colorMap[color] || colorMap.amber;
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
      <Icon size={20} className={`${c.text} mb-3`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-neutral-500 text-xs mt-1">{label}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    paid:    'text-green-400 bg-green-400/10 border-green-400/30',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    failed:  'text-red-400   bg-red-400/10   border-red-400/30',
  };
  return (
    <span className={`text-xs border rounded-full px-2 py-0.5 capitalize ${map[status] || 'text-neutral-400 border-neutral-700'}`}>
      {status}
    </span>
  );
};

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
