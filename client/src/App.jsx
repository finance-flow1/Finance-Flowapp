import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login        from './pages/Login.jsx';
import Register     from './pages/Register.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';

const isAuth = () => !!localStorage.getItem('ff_token');

const PrivateRoute = ({ children }) =>
  isAuth() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  isAuth() ? <Navigate to="/dashboard" replace /> : children;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transactions"  element={<PrivateRoute><Transactions /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
