import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <PrivateRoute>
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            } />

            <Route path="/reports" element={
              <PrivateRoute>
                <Layout><Reports /></Layout>
              </PrivateRoute>
            } />

            <Route path="/expenses" element={
              <PrivateRoute>
                <Layout><Expenses /></Layout>
              </PrivateRoute>
            } />

            <Route path="/orders" element={
              <PrivateRoute>
                <Layout><Orders /></Layout>
              </PrivateRoute>
            } />

            <Route path="/products" element={
              <PrivateRoute>
                <Layout><Products /></Layout>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
