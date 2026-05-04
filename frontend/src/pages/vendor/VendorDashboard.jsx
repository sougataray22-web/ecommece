import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import {
  LayoutDashboard, Package, ShoppingCart, IndianRupee,
  Plus, TrendingUp, LogOut, Store, ChevronRight,
  BarChart2, AlertCircle, Clock
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', path: '/vendor/dashboard', Icon: LayoutDashboard },
  { label: 'Products',  path: '/vendor/products',  Icon: Package },
  { label: 'Orders',    path: '/vendor/orders',    Icon: ShoppingCart },
];

export default function VendorDashboard() {
  const { user, logout } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders/vendor/analytics'),
      api.get('/orders?limit=5'),
      api.get('/products/vendor/mine?limit=5'),
    ]).then(([a, o, p]) => {
      setAnalytics(a.data.analytics);
      setOrders(o.data.orders || []);
      setProducts(p.data.products || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex-col hidden lg:flex shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center">
              <Store size={18} className="text-neutral-950" />
            </div>
            <div>
              <p className="font-bold text-white text-sm truncate max-w-[140px]">{user?.businessName || 'My Store'}</p>
              <p className="text-amber-400 text-xs font-medium">Vendor Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ label, path, Icon }) => (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <p className="text-white text-sm font-medium px-4 truncate">{user?.name || 'Vendor'}</p>
          <p className="text-neutral-500 text-xs px-4 mb-2 truncate">{user?.email}</p>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut size={16} /> <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={20} className="text-amber-400" /> Vendor Dashboard
          </h1>
          <Link to="/vendor/products/add"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold
                       px-4 py-2 rounded-xl text-sm transition-all">
            <Plus size={14} /> Add Product
          </Link>
        </div>

        <div className="p-6 lg:p-8">
          {loading ? <Loader /> : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Revenue" value={`₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN')}`} Icon={IndianRupee} color="amber" />
                <StatCard label="Total Orders"  value={analytics?.totalOrders  || 0} Icon={ShoppingCart} color="blue" />
                <StatCard label="Products"      value={products.length}              Icon={Package}      color="purple" />
                <StatCard label="This Month"    value={`₹${(analytics?.monthlyRevenue?.at(-1)?.revenue || 0).toLocaleString('en-IN')}`} Icon={TrendingUp} color="green" />
              </div>

              {/* Monthly Revenue Chart (simple bar) */}
              {analytics?.monthlyRevenue?.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
                  <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
                    <BarChart2 size={16} className="text-amber-400" /> Revenue — Last 6 Months
                  </h2>
                  <MiniBarChart data={analytics.monthlyRevenue} />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <ShoppingCart size={15} className="text-amber-400" /> Recent Orders
                    </h2>
                    <Link to="/vendor/orders" className="text-amber-400 text-xs flex items-center gap-1">
                      View All <ChevronRight size={13} />
                    </Link>
                  </div>
                  {orders.length === 0 ? (
                    <EmptyMsg icon={<ShoppingCart size={20}/>} msg="No orders yet" />
                  ) : orders.map((o) => (
                    <div key={o._id} className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{o.orderNumber}</p>
                        <p className="text-neutral-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-semibold text-sm">₹{o.grandTotal?.toLocaleString('en-IN')}</p>
                        <StatusBadge s={o.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Products */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <Package size={15} className="text-amber-400" /> My Products
                    </h2>
                    <Link to="/vendor/products" className="text-amber-400 text-xs flex items-center gap-1">
                      Manage <ChevronRight size={13} />
                    </Link>
                  </div>
                  {products.length === 0 ? (
                    <EmptyMsg icon={<Package size={20}/>} msg="No products listed yet" />
                  ) : products.map((p) => (
                    <div key={p._id} className="flex items-center gap-4 px-6 py-3 border-b border-neutral-800 last:border-0">
                      <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.name}</p>
                        <p className="text-neutral-500 text-xs">₹{p.effectivePrice?.toLocaleString('en-IN')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${p.totalStock > 0 ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-red-400 bg-red-400/10 border-red-400/30'}`}>
                        {p.totalStock > 0 ? `${p.totalStock} stock` : 'Out of stock'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={`${d._id.year}-${d._id.month}`} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full bg-amber-400/20 rounded-t-md relative overflow-hidden"
               style={{ height: `${Math.round((d.revenue / max) * 100)}%`, minHeight: '4px' }}>
            <div className="absolute inset-0 bg-amber-400 opacity-80" />
          </div>
          <span className="text-neutral-500 text-xs">{MONTHS[d._id.month - 1]}</span>
        </div>
      ))}
    </div>
  );
};

const colorMap = {
  amber:  { bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  icon: 'text-amber-400'  },
  blue:   { bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   icon: 'text-blue-400'   },
  purple: { bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: 'text-purple-400' },
  green:  { bg: 'bg-green-400/10',  border: 'border-green-400/20',  icon: 'text-green-400'  },
};
const StatCard = ({ label, value, Icon, color }) => {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
      <Icon size={18} className={`${c.icon} mb-3`} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-neutral-500 text-xs mt-1">{label}</p>
    </div>
  );
};
const StatusBadge = ({ s }) => {
  const map = { confirmed: 'text-blue-400', delivered: 'text-green-400', cancelled: 'text-red-400', pending: 'text-amber-400', shipped: 'text-purple-400' };
  return <span className={`text-xs capitalize ${map[s] || 'text-neutral-400'}`}>{s}</span>;
};
const EmptyMsg = ({ icon, msg }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-neutral-600">
    {icon}
    <p className="text-sm">{msg}</p>
  </div>
);
const Loader = () => (
  <div className="flex items-center justify-center h-60">
    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
