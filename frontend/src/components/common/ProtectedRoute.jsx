import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

// ─── Require authenticated ────────────────────────────────────────────────────
export const ProtectedRoute = ({ children }) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  const location = useLocation();
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// ─── Require Owner ────────────────────────────────────────────────────────────
export const OwnerRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (!user)              return <Navigate to="/login" replace />;
  if (user.role !== 'owner') return <Navigate to="/"   replace />;
  return children;
};

// ─── Require Vendor (approved) ────────────────────────────────────────────────
export const VendorRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (!user)                  return <Navigate to="/login"          replace />;
  if (user.role !== 'vendor') return <Navigate to="/"              replace />;
  if (!user.isApproved)       return <Navigate to="/vendor/kyc-pending" replace />;
  return children;
};

// ─── Redirect authenticated users away from login ─────────────────────────────
export const GuestRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'owner')    return <Navigate to="/admin/dashboard"   replace />;
  if (user?.role === 'vendor' && user?.isApproved)
                                  return <Navigate to="/vendor/dashboard" replace />;
  if (user?.role === 'vendor' && user?.kycSubmitted)
                                  return <Navigate to="/vendor/kyc-pending" replace />;
  if (user?.role === 'vendor')    return <Navigate to="/vendor/kyc"       replace />;
  if (user?.role === 'customer') return <Navigate to="/"                 replace />;
  return children;
};
