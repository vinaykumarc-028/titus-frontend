import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ToastContainer } from './components/ui/ToastContainer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Portals & Login
import { PortalSelection } from './pages/PortalSelection';
import { LoginDocument } from './pages/LoginDocument';
import { LoginAdmin } from './pages/LoginAdmin';

// Document Portal Pages
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Review } from './pages/Review';
import { GeneratingDocument } from './pages/GeneratingDocument';
import { Success } from './pages/Success';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { Processing } from './pages/Processing';
import { Profile } from './pages/Profile';
import { ValidationLab } from './pages/ValidationLab';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDocuments } from './pages/admin/AdminDocuments';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public / Login Routes */}
        <Route path="/login" element={<PortalSelection />} />
        <Route path="/login/document" element={<LoginDocument />} />
        <Route path="/login/admin" element={<LoginAdmin />} />

        {/* Document Portal — requires login */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="processing" element={<Processing />} />
          <Route path="review" element={<Review />} />
          <Route path="generating-document" element={<GeneratingDocument />} />
          <Route path="success" element={<Success />} />
          <Route path="documents" element={<Documents />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dev/ocr-validation" element={<ValidationLab />} />
        </Route>

        {/* Admin Portal — requires login AND Admin role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
