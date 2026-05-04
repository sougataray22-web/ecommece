import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Store, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const fetchVendors = () => {
    setLoading(true);
    const q = filter !== 'all' ? '?isApproved=' + (filter === 'approved') : '';
    api.get('/admin/vendors' + q).then((r) => setVendors(r.data.vendors || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVendors(); }, [filter]);

  const toggle = async (id) => {
    try {
      const res = await api.patch('/admin/vendors/' + id + '/toggle');
      toast.success(res.data.message);
      fetchVendors();
    } catch { toast.error('Failed.'); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/dashboard" className="text-neutral-500 hover:text-white"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store size={22} className="text-amber-400"/> Vendors</h1>
        </div>
        <div className="flex gap-2 mb-6">
          {['all','approved','pending'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ' +
                (filter === f ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white')}>
              {f}
            </button>
          ))}
        </div>
        {loading ? <Loader /> : vendors.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><Store size={40} className="mx-auto mb-3"/><p>No vendors found</p></div>
        ) : (
          <div className="space-y-3">
            {vendors.map((v) => (
              <div key={v._id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <div>
                  <p className="font-semibold text-white">{v.businessName || v.name}</p>
                  <p className="text-neutral-500 text-sm">{v.email || v.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (v.isApproved ? 'text-green-400 bg-green-400/10 border-green-400/30' : 'text-amber-400 bg-amber-400/10 border-amber-400/30')}>
                      {v.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (v.isActive ? 'text-blue-400 bg-blue-400/10 border-blue-400/30' : 'text-red-400 bg-red-400/10 border-red-400/30')}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <button onClick={() => toggle(v._id)}
                  className={'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ' +
                    (v.isActive ? 'border-red-400/30 text-red-400 hover:bg-red-400/10' : 'border-green-400/30 text-green-400 hover:bg-green-400/10')}>
                  {v.isActive ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                  {v.isActive ? 'Deactivate' : 'Activate'}
                </button>
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
