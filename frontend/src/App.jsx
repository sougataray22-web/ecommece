import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, OwnerRoute, VendorRoute, GuestRoute } from './components/common/ProtectedRoute';

// ─── Lazy Pages ───────────────────────────────────────────────────────────────
const LoginPage            = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage         = lazy(() => import('./pages/auth/RegisterPage'));

const HomePage             = lazy(() => import('./pages/customer/HomePage'));
const ProductListPage      = lazy(() => import('./pages/customer/ProductListPage'));
const ProductDetailPage    = lazy(() => import('./pages/customer/ProductDetailPage'));
const CartPage             = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage         = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderConfirmPage     = lazy(() => import('./pages/customer/OrderConfirmPage'));
const OrdersPage           = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage      = lazy(() => import('./pages/customer/OrderDetailPage'));
const ProfilePage          = lazy(() => import('./pages/customer/ProfilePage'));

const AdminDashboard       = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminKYCList         = lazy(() => import('./pages/admin/AdminKYCList'));
const AdminKYCDetail       = lazy(() => import('./pages/admin/AdminKYCDetail'));
const AdminBanners         = lazy(() => import('./pages/admin/AdminBanners'));
const AdminVendors         = lazy(() => import('./pages/admin/AdminVendors'));
const AdminOrders          = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts        = lazy(() => import('./pages/admin/AdminProducts'));

const VendorDashboard      = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorKYCForm        = lazy(() => import('./pages/vendor/VendorKYCForm'));
const VendorKYCPending     = lazy(() => import('./pages/vendor/VendorKYCPending'));
const VendorProducts       = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorAddProduct     = lazy(() => import('./pages/vendor/VendorAddProduct'));
const VendorEditProduct    = lazy(() => import('./pages/vendor/VendorEditProduct'));
const VendorOrders         = lazy(() => import('./pages/vendor/VendorOrders'));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-950">
    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* ── Public ────────────────────────────────────────── */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/products"        element={<ProductListPage />} />
          <Route path="/products/:slug"  element={<ProductDetailPage />} />
          <Route path="/cart"            element={<CartPage />} />

          {/* ── Auth ──────────────────────────────────────────── */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* ── Customer ──────────────────────────────────────── */}
          <Route path="/checkout"          element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/order/confirm"     element={<ProtectedRoute><OrderConfirmPage /></ProtectedRoute>} />
          <Route path="/orders"            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id"        element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* ── Vendor ────────────────────────────────────────── */}
          <Route path="/vendor/kyc"        element={<ProtectedRoute><VendorKYCForm /></ProtectedRoute>} />
          <Route path="/vendor/kyc-pending" element={<ProtectedRoute><VendorKYCPending /></ProtectedRoute>} />
          <Route path="/vendor/dashboard"  element={<VendorRoute><VendorDashboard /></VendorRoute>} />
          <Route path="/vendor/products"   element={<VendorRoute><VendorProducts /></VendorRoute>} />
          <Route path="/vendor/products/add" element={<VendorRoute><VendorAddProduct /></VendorRoute>} />
          <Route path="/vendor/products/:id/edit" element={<VendorRoute><VendorEditProduct /></VendorRoute>} />
          <Route path="/vendor/orders"     element={<VendorRoute><VendorOrders /></VendorRoute>} />

          {/* ── Admin / Owner ─────────────────────────────────── */}
          <Route path="/admin/dashboard"   element={<OwnerRoute><AdminDashboard /></OwnerRoute>} />
          <Route path="/admin/kyc"         element={<OwnerRoute><AdminKYCList /></OwnerRoute>} />
          <Route path="/admin/kyc/:id"     element={<OwnerRoute><AdminKYCDetail /></OwnerRoute>} />
          <Route path="/admin/banners"     element={<OwnerRoute><AdminBanners /></OwnerRoute>} />
          <Route path="/admin/vendors"     element={<OwnerRoute><AdminVendors /></OwnerRoute>} />
          <Route path="/admin/orders"      element={<OwnerRoute><AdminOrders /></OwnerRoute>} />
          <Route path="/admin/products"    element={<OwnerRoute><AdminProducts /></OwnerRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
