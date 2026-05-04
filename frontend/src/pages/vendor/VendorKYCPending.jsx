import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileCheck } from 'lucide-react';
export default function VendorKYCPending() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8" style={{fontFamily:"'DM Sans',sans-serif"}}>
      <div className="w-16 h-16 bg-amber-400/15 border border-amber-400/30 rounded-2xl flex items-center justify-center mb-6">
        <Clock size={28} className="text-amber-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">KYC Under Review</h1>
      <p className="text-neutral-400 text-center max-w-sm mb-8">
        Your KYC documents have been submitted and are under review by our team. You'll receive an email once approved.
      </p>
      <Link to="/" className="border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-6 py-3 rounded-xl transition-colors text-sm">
        Back to Homepage
      </Link>
    </div>
  );
}
