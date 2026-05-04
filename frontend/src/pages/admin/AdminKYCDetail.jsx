import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';

export default function AdminKYCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kyc, setKyc]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason]   = useState('');
  const [acting, setActing]   = useState(false);

  useEffect(() => {
    api.get(`/kyc/${id}`)
      .then((r) => setKyc(r.data.kyc))
      .catch(() => setKyc(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (action) => {
    if (action === 'reject' && !reason.trim()) return toast.error('Rejection reason is required.');
    setActing(true);
    try {
      await api.patch(`/kyc/${id}/review`, { action, reason });
      toast.success(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      navigate('/admin/kyc');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <AdminLayout><p className="text-neutral-400">Loading…</p></AdminLayout>;
  if (!kyc)    return <AdminLayout><p className="text-red-400">KYC not found.</p></AdminLayout>;

  const statusColors = { pending: 'text-amber-400', approved: 'text-green-400', rejected: 'text-red-400' };

  return (
    <AdminLayout>
      <button onClick={() => navigate('/admin/kyc')}
        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to KYC List
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{kyc.businessName}</h1>
          <p className="text-neutral-400">{kyc.vendor?.email || kyc.vendor?.phone}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize
          ${kyc.status === 'pending'  ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
          : kyc.status === 'approved' ? 'border-green-400/40 bg-green-400/10 text-green-400'
          : 'border-red-400/40 bg-red-400/10 text-red-400'}`}>
          {kyc.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Business & Identity */}
        <Section title="Business & Identity">
          <Row label="Business Name"    value={kyc.businessName} />
          <Row label="Business Address" value={kyc.businessAddress} />
          <Row label="Aadhar Number"    value={kyc.aadharNumber} />
          {kyc.gstNumber && <Row label="GST" value={kyc.gstNumber} />}
          {kyc.panNumber  && <Row label="PAN" value={kyc.panNumber} />}
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          <Row label="Account Holder" value={kyc.bankAccountName} />
          <Row label="Account Number" value={kyc.bankAccountNumber} />
          <Row label="IFSC Code"      value={kyc.bankIfscCode} />
          {kyc.bankName && <Row label="Bank" value={kyc.bankName} />}
        </Section>
      </div>

      {/* Documents */}
      <Section title="KYC Documents" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <DocImage label="Aadhar Front" url={kyc.aadharFront} />
          {kyc.aadharBack && <DocImage label="Aadhar Back" url={kyc.aadharBack} />}
          <DocImage label="Live Photo"   url={kyc.livePhoto} />
        </div>
      </Section>

      {/* Action Panel */}
      {kyc.status === 'pending' && (
        <Section title="Review Action">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Rejection Reason (required for reject)</label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                placeholder="Explain why the KYC is being rejected…"
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                           placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleReview('approve')} disabled={acting}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                <CheckCircle size={18} /> {acting ? 'Processing…' : 'Approve KYC'}
              </button>
              <button onClick={() => handleReview('reject')} disabled={acting}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold py-3 rounded-xl
                           flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                <XCircle size={18} /> {acting ? 'Processing…' : 'Reject KYC'}
              </button>
            </div>
          </div>
        </Section>
      )}

      {kyc.status !== 'pending' && (
        <div className={`p-4 rounded-xl border ${kyc.status === 'approved' ? 'border-green-400/30 bg-green-400/10' : 'border-red-400/30 bg-red-400/10'}`}>
          <p className={`font-semibold ${kyc.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
            This KYC has been <strong>{kyc.status}</strong>
            {kyc.rejectionReason ? ` — ${kyc.rejectionReason}` : ''}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div className="max-w-4xl mx-auto">{children}</div>
  </div>
);

const Section = ({ title, children, className = '' }) => (
  <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 ${className}`}>
    <h3 className="font-semibold text-neutral-300 mb-4 text-sm uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-neutral-800 py-2 text-sm">
    <span className="text-neutral-500">{label}</span>
    <span className="text-white font-medium text-right max-w-[60%] break-all">{value || '—'}</span>
  </div>
);

const DocImage = ({ label, url }) => (
  <div>
    <p className="text-xs text-neutral-500 mb-2">{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block relative group">
        <img src={url} alt={label}
          className="w-full h-40 object-cover rounded-xl border border-neutral-700 group-hover:border-amber-400 transition-colors" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl
                        flex items-center justify-center">
          <ExternalLink size={20} className="text-white" />
        </div>
      </a>
    ) : (
      <div className="w-full h-40 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-center">
        <span className="text-neutral-600 text-xs">Not provided</span>
      </div>
    )}
  </div>
);
