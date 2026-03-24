import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import OfferingDetail from './pages/OfferingDetail';
import CreateOffering from './pages/CreateOffering';
import Portfolio from './pages/Portfolio';
import MyProjects from './pages/MyProjects';
import MyAccount from './pages/MyAccount';
import SecondaryMarket from './pages/SecondaryMarket';
import Admin from './pages/Admin';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/marketplace" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Layout><Navigate to="/marketplace" /></Layout>} />
      <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />
      <Route path="/offering/:id" element={<Layout><OfferingDetail /></Layout>} />
      <Route path="/portfolio" element={<Layout><ProtectedRoute roles={['investor', 'admin']}><Portfolio /></ProtectedRoute></Layout>} />
      <Route path="/my-account" element={<Layout><ProtectedRoute roles={['investor', 'admin']}><MyAccount /></ProtectedRoute></Layout>} />
      <Route path="/create" element={<Layout><ProtectedRoute roles={['business', 'admin']}><CreateOffering /></ProtectedRoute></Layout>} />
      <Route path="/my-projects" element={<Layout><ProtectedRoute roles={['business', 'admin']}><MyProjects /></ProtectedRoute></Layout>} />
      <Route path="/secondary" element={<Layout><ProtectedRoute roles={['investor', 'admin']}><SecondaryMarket /></ProtectedRoute></Layout>} />
      <Route path="/admin" element={<Layout><ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute></Layout>} />
      <Route path="*" element={<Navigate to="/marketplace" replace />} />
    </Routes>
  );
}
