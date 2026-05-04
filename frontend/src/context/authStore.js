import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('user') || 'null'),
  token:   localStorage.getItem('token') || null,
  loading: false,

  // ── Send OTP ──────────────────────────────────────────────────────────────
  sendOtp: async (identifier, type, purpose = 'login') => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/send-otp', { identifier, type, purpose });
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Failed to send OTP.' };
    } finally {
      set({ loading: false });
    }
  },

  // ── Verify OTP → get token + redirectPath ─────────────────────────────────
  verifyOtp: async (identifier, type, otp, role) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, type, otp, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      set({ user: data.user, token: data.token });
      return { ok: true, redirectPath: data.redirectPath };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Verification failed.' };
    } finally {
      set({ loading: false });
    }
  },

  // ── Refresh me ───────────────────────────────────────────────────────────
  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch {}
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  // ── Role helpers ──────────────────────────────────────────────────────────
  isOwner:           () => get().user?.role === 'owner',
  isVendor:          () => get().user?.role === 'vendor',
  isApprovedVendor:  () => get().user?.role === 'vendor' && get().user?.isApproved,
  isCustomer:        () => get().user?.role === 'customer',
  isAuthenticated:   () => !!get().token,
}));

export default useAuthStore;
