import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FileCheck, ChevronRight, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const TABS = [
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All'      },
];

export default function AdminKYCList() {
  const [kycs, setKycs]       = useState([]);
  const [status, setStatus]   = useState('pending');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get('/kyc/all?status=' + status + '&limit=50')
      .then((r) => { setKycs(r.data.kycs || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  }, [status]);

  const badgeClass = {
    pending:  'text-amber-400 bg-amber-400/10 border-amber-400/30',
    approved: 'text-green-400 bg-green-400/10 border-green-400/30',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 lg:p-8" style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/dashboard" className="text-neutral-500 hover:text-white"><ArrowLeft size={18}/></Link>
          <h1 className="text-2xl font-bold">KYC Review</h1>
        </div>
        <div className="flex gap-2 mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setStatus(key)}
              className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ' +
                (status === key ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300')}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-neutral-500 text-sm mb-4">{total} applications</p>
        {loading ? <Loader /> : kycs.length === 0 ? (
          <div className="text-center py-20 text-neutral-600"><FileCheck size={40} className="mx-auto mb-3"/><p>No applications</p></div>
        ) : (
          <div className="space-y-3">
            {kycs.map((k) => (
              <Link key={k._id} to={'/admin/kyc/' + k._id}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition-colors">
                <div>
                  <p className="font-semibold text-white">{k.businessName}</p>
                  <p className="text-neutral-500 text-sm">{k.vendor?.name} · {k.vendor?.email || k.vendor?.phone}</p>
                  <p className="text-neutral-600 text-xs mt-1">{new Date(k.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={'text-xs px-3 py-1 rounded-full border font-medium capitalize ' + (badgeClass[k.status] || 'text-neutral-400 border-neutral-700')}>{k.status}</span>
                  <ChevronRight size={16} className="text-neutral-600"/>
                </div>
              </Link>
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
