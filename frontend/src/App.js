import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';

import LoginPage          from './pages/auth/LoginPage';
import DashboardPage      from './pages/dashboard/DashboardPage';
import ProductsPage       from './pages/products/ProductsPage';
import CategoriesPage     from './pages/products/CategoriesPage';
import SuppliersPage      from './pages/suppliers/SuppliersPage';
import WarehousesPage     from './pages/warehouses/WarehousesPage';
import StockPage          from './pages/stock/StockPage';
import PurchaseOrdersPage from './pages/purchaseOrders/PurchaseOrdersPage';
import OrdersPage         from './pages/orders/OrdersPage';
import ReportsPage        from './pages/reports/ReportsPage';
import EmployeesPage      from './pages/employees/EmployeesPage';
import AuditLogsPage      from './pages/admin/AuditLogsPage';

const Protected = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '10px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/"      element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<Protected><DashboardPage /></Protected>} />
          <Route path="/products"        element={<Protected><ProductsPage /></Protected>} />
          <Route path="/categories"      element={<Protected roles={['admin','manager']}><CategoriesPage /></Protected>} />
          <Route path="/suppliers"       element={<Protected roles={['admin','manager']}><SuppliersPage /></Protected>} />
          <Route path="/warehouses"      element={<Protected roles={['admin','manager']}><WarehousesPage /></Protected>} />
          <Route path="/stock"           element={<Protected><StockPage /></Protected>} />
          <Route path="/purchase-orders" element={<Protected><PurchaseOrdersPage /></Protected>} />
          <Route path="/orders"          element={<Protected><OrdersPage /></Protected>} />
          <Route path="/reports"         element={<Protected roles={['admin','manager','viewer']}><ReportsPage /></Protected>} />
          <Route path="/audit-logs"       element={<Protected roles={['admin']}><AuditLogsPage /></Protected>} />
          <Route path="/employees"       element={<Protected roles={['admin']}><EmployeesPage /></Protected>} />
          <Route path="*"                element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
