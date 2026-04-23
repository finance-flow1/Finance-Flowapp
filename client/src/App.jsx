import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Admin        from './pages/Admin.jsx';

const getUser  = () => JSON.parse(localStorage.getItem('ff_user') || '{}');
const isAuth   = () => !!localStorage.getItem('ff_token');
const isAdmin  = () => getUser().role === 'admin';

// Unauthenticated → /login; authenticated admin → /admin; user → /dashboard
const RootRedirect = () => {
  if (!isAuth()) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
};

const PrivateRoute = ({ children }) =>
  isAuth() ? children : <Navigate to="/login" replace />;

const AdminRoute = ({ children }) =>
  isAuth() && isAdmin() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  isAuth() ? <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace /> : children;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<RootRedirect />} />
        <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/admin"        element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
