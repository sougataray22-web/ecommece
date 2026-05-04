import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import { Camera, Upload, CheckCircle, CreditCard, Building2, User, RefreshCw } from 'lucide-react';

const STEPS = ['Business Info', 'Aadhar KYC', 'Bank Details', 'Live Photo', 'Review'];

export default function VendorKYCForm() {
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const webcamRef  = useRef(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64
  const [showCam, setShowCam] = useState(false);

  const [form, setForm] = useState({
    businessName:      '',
    businessAddress:   '',
    gstNumber:         '',
    panNumber:         '',
    aadharNumber:      '',
    aadharFrontFile:   null,
    aadharBackFile:    null,
    bankAccountNumber: '',
    bankIfscCode:      '',
    bankAccountName:   '',
    bankName:          '',
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const capturePhoto = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) { setCapturedPhoto(img); setShowCam(false); }
  }, [webcamRef]);

  const handleSubmit = async () => {
    if (!capturedPhoto)        return toast.error('Live photo is required.');
    if (!form.aadharFrontFile) return toast.error('Aadhar front image is required.');

    setLoading(true);
    try {
      const fd = new FormData();

      // Text fields
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'aadharFrontFile' && k !== 'aadharBackFile' && v) fd.append(k, v);
      });

      // Files
      fd.append('aadharFront', form.aadharFrontFile);
      if (form.aadharBackFile) fd.append('aadharBack', form.aadharBackFile);

      // Live photo: convert base64 to File
      const blob     = await fetch(capturedPhoto).then((r) => r.blob());
      const photoFile = new File([blob], 'live-photo.jpg', { type: 'image/jpeg' });
      fd.append('livePhoto', photoFile);

      await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMe();
      toast.success('KYC submitted! Awaiting approval.');
      navigate('/vendor/kyc-pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-2">Vendor Verification (KYC)</h1>
        <p className="text-neutral-400 text-sm mb-8">Complete your KYC to start selling on our platform.</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 shrink-0 ${i <= step ? 'text-amber-400' : 'text-neutral-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${i < step ? 'bg-amber-400 border-amber-400 text-neutral-950'
                    : i === step ? 'border-amber-400 text-amber-400'
                    : 'border-neutral-700 text-neutral-600'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-amber-400' : 'bg-neutral-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">

          {/* ── Step 0: Business Info ──────────────────────────────────────── */}
          {step === 0 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2"><Building2 size={18}/> Business Information</h2>
              <Input label="Business Name *" value={form.businessName} onChange={(v) => update('businessName', v)} placeholder="Your Store Name" />
              <Textarea label="Business Address *" value={form.businessAddress} onChange={(v) => update('businessAddress', v)} placeholder="Full business address" />
              <Input label="GST Number" value={form.gstNumber} onChange={(v) => update('gstNumber', v)} placeholder="22AAAAA0000A1Z5" />
              <Input label="PAN Number" value={form.panNumber} onChange={(v) => update('panNumber', v)} placeholder="ABCDE1234F" />
            </>
          )}

          {/* ── Step 1: Aadhar ───────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2"><CreditCard size={18}/> Aadhar Card Verification</h2>
              <Input label="Aadhar Number *" value={form.aadharNumber} onChange={(v) => update('aadharNumber', v)} placeholder="1234 5678 9012" maxLength={12} />
              <FileInput label="Aadhar Front *" accept="image/*,application/pdf" onChange={(f) => update('aadharFrontFile', f)} />
              <FileInput label="Aadhar Back"    accept="image/*,application/pdf" onChange={(f) => update('aadharBackFile', f)} />
            </>
          )}

          {/* ── Step 2: Bank ─────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2"><Building2 size={18}/> Bank Details</h2>
              <Input label="Account Holder Name *" value={form.bankAccountName} onChange={(v) => update('bankAccountName', v)} placeholder="As per bank records" />
              <Input label="Account Number *" value={form.bankAccountNumber} onChange={(v) => update('bankAccountNumber', v)} placeholder="Account number" />
              <Input label="IFSC Code *" value={form.bankIfscCode} onChange={(v) => update('bankIfscCode', v.toUpperCase())} placeholder="SBIN0001234" />
              <Input label="Bank Name" value={form.bankName} onChange={(v) => update('bankName', v)} placeholder="State Bank of India" />
            </>
          )}

          {/* ── Step 3: Live Photo ───────────────────────────────────────── */}
          {step === 3 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2"><User size={18}/> Live Photo Verification</h2>
              <p className="text-neutral-400 text-sm">Take a live selfie. Ensure good lighting and face the camera directly.</p>

              {capturedPhoto ? (
                <div className="relative">
                  <img src={capturedPhoto} alt="Captured" className="w-full max-w-xs mx-auto rounded-2xl border-2 border-amber-400" />
                  <button
                    onClick={() => { setCapturedPhoto(null); setShowCam(true); }}
                    className="absolute top-2 right-2 bg-neutral-900 border border-neutral-700 rounded-full p-2 text-neutral-400 hover:text-white"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              ) : showCam ? (
                <div className="space-y-3">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-2xl border border-neutral-700"
                    mirrored
                  />
                  <button onClick={capturePhoto}
                    className="w-full bg-amber-400 text-neutral-950 font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Camera size={18} /> Capture Photo
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowCam(true)}
                  className="w-full border-2 border-dashed border-neutral-700 hover:border-amber-400 rounded-2xl py-12
                             flex flex-col items-center gap-3 text-neutral-400 hover:text-amber-400 transition-colors">
                  <Camera size={32} />
                  <span className="font-medium">Open Camera</span>
                  <span className="text-xs">Click to start live photo capture</span>
                </button>
              )}
            </>
          )}

          {/* ── Step 4: Review ───────────────────────────────────────────── */}
          {step === 4 && (
            <>
              <h2 className="font-semibold text-lg flex items-center gap-2"><CheckCircle size={18} className="text-amber-400"/> Review & Submit</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['Business Name',   form.businessName],
                  ['Aadhar Number',   form.aadharNumber],
                  ['Account Number',  form.bankAccountNumber],
                  ['IFSC Code',       form.bankIfscCode],
                  ['Account Name',    form.bankAccountName],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-neutral-800 py-2">
                    <span className="text-neutral-400">{label}</span>
                    <span className="text-white font-medium">{val || '—'}</span>
                  </div>
                ))}
                {capturedPhoto && (
                  <div className="pt-3">
                    <p className="text-neutral-400 mb-2">Live Photo</p>
                    <img src={capturedPhoto} alt="live" className="w-24 h-24 rounded-xl object-cover border border-amber-400/50" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Navigation Buttons ───────────────────────────────────────── */}
          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-neutral-700 text-neutral-300 hover:text-white py-3 rounded-xl transition-colors">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => {
                if (step === 0 && (!form.businessName || !form.businessAddress)) return toast.error('Fill business name & address.');
                if (step === 1 && (!form.aadharNumber || !form.aadharFrontFile)) return toast.error('Aadhar number and front image required.');
                if (step === 2 && (!form.bankAccountNumber || !form.bankIfscCode || !form.bankAccountName)) return toast.error('Fill all bank details.');
                if (step === 3 && !capturedPhoto) return toast.error('Capture your live photo.');
                setStep(s => s + 1);
              }} className="flex-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold py-3 rounded-xl transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold py-3 rounded-xl transition-all disabled:opacity-60">
                {loading ? 'Submitting…' : 'Submit KYC'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable form components ──────────────────────────────────────────
const Input = ({ label, value, onChange, ...props }) => (
  <div>
    <label className="block text-sm text-neutral-400 mb-1">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} {...props}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors" />
  </div>
);

const Textarea = ({ label, value, onChange, ...props }) => (
  <div>
    <label className="block text-sm text-neutral-400 mb-1">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} {...props}
      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm
                 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
  </div>
);

const FileInput = ({ label, accept, onChange }) => {
  const [name, setName] = useState('');
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1">{label}</label>
      <label className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 cursor-pointer hover:border-amber-400 transition-colors">
        <Upload size={16} className="text-neutral-400" />
        <span className="text-sm text-neutral-400 flex-1 truncate">{name || 'Choose file…'}</span>
        <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { onChange(f); setName(f.name); } }} />
      </label>
    </div>
  );
};
