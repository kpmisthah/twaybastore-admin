import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout
import AdminLayout from "./Layout/AdminLayout";

// Pages (Admin)
import DashboardHome from "./pages/DashboardHome";
import ProductsPage from "./pages/ProductsPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import OrdersPage from "./pages/OrdersPage";
import SupportChat from "./pages/SupportChat";
import Inventory from "./components/Inventory";
import ProductsAnalytics from "./pages/ProductsAnalytics";
import UsersList from "./pages/UsersList";
import ProductClicksAnalytics from "./pages/ProductClicksAnalytics";
import CategoryClickAnalytics from "./pages/CategoryClickAnalytics";
import AdminPayments from "./pages/AdminPayments";
import AdminRefundLogs from "./components/AdminRefundLogs.jsx";
import AdminVoiceSearches from "./components/AdminVoiceSearches.jsx";

// Auth page
import Login from "./pages/Login.jsx";
import PageAnalytics from "./components/PageAnalytics.jsx";
import AdminBroadcastPage from "./pages/AdminBroadcastPage.jsx";

function AdminShell({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <>
    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

    <AuthProvider>
      <Routes>
        {/* Redirect root to /login (default landing) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public: Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <AdminShell>
              <DashboardHome />
            </AdminShell>
          }
        />

        <Route
          path="/admin/inventory"
          element={
            <AdminShell>
              <Inventory />
            </AdminShell>
          }
        />

        <Route
          path="/product/Analytics"
          element={
            <AdminShell>
              <ProductsAnalytics />
            </AdminShell>
          }
        />

        <Route
          path="/UsersList"
          element={
            <AdminShell>
              <UsersList />
            </AdminShell>
          }
        />

        <Route
          path="/VoiceSearches"
          element={
            <AdminShell>
              <AdminVoiceSearches />
            </AdminShell>
          }
        />

        <Route
          path="/AdminRefundLogs"
          element={
            <AdminShell>
              <AdminRefundLogs />
            </AdminShell>
          }
        />

        <Route
          path="/AdminPayments"
          element={
            <AdminShell>
              <AdminPayments />
            </AdminShell>
          }
        />

        <Route
          path="/ProductClicksAnalytics"
          element={
            <AdminShell>
              <ProductClicksAnalytics />
            </AdminShell>
          }
        />

        <Route
          path="/CategoryClickAnalytics"
          element={
            <AdminShell>
              <CategoryClickAnalytics />
            </AdminShell>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminShell>
              <ProductsPage />
            </AdminShell>
          }
        />

        <Route
          path="/admin/products/add"
          element={
            <AdminShell>
              <AddProductPage />
            </AdminShell>
          }
        />

        <Route
          path="/admin/products/edit/:id"
          element={
            <AdminShell>
              <EditProductPage />
            </AdminShell>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminShell>
              <OrdersPage />
            </AdminShell>
          }
        />

        <Route
          path="/adminmails"
          element={
            <AdminShell>
              <AdminBroadcastPage />
            </AdminShell>
          }
        />

        <Route
          path="/supportchat"
          element={
            <AdminShell>
              <SupportChat />
            </AdminShell>
          }
        />

        <Route
          path="/page-visit"
          element={
            <AdminShell>
              <PageAnalytics />
            </AdminShell>
          }
        />

        {/* Unknown admin paths go to /admin (still protected) */}
        <Route
          path="/admin/*"
          element={
            <AdminShell>
              <div>Not Found</div>
            </AdminShell>
          }
        />
        {/* 404 fallback */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </AuthProvider>
  </>
);

export default App;
