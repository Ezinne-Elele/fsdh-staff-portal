import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import MFAVerification from './pages/Auth/MFAVerification';
import Dashboard from './pages/Dashboard/Dashboard';
import TradeOperations from './pages/Trades/TradeOperations';
import Instructions from './pages/Instructions/Instructions';
import InstructionDetail from './pages/Instructions/InstructionDetail';
import CorporateActions from './pages/CorporateActions/CorporateActions';
import InstrumentCoverage from './pages/Instruments/InstrumentCoverage';
import Reconciliations from './pages/Reconciliations/Reconciliations';
import Exceptions from './pages/Exceptions/Exceptions';
import Clients from './pages/Clients/Clients';
import Users from './pages/Users/Users';
import Reports from './pages/Reports/Reports';
import Compliance from './pages/Compliance/Compliance';
import Settings from './pages/Settings/Settings';
import IncomeTaxProcessing from './pages/IncomeTax/IncomeTaxProcessing';
import Billing from './pages/Billing/Billing';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/mfa-verify" element={<MFAVerification />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="trades" element={<TradeOperations />} />
        <Route path="instruments" element={<InstrumentCoverage />} />
        <Route path="instructions" element={<Instructions />} />
        <Route path="instructions/:id" element={<InstructionDetail />} />
        <Route path="corporate-actions" element={<CorporateActions />} />
        <Route path="reconciliations" element={<Reconciliations />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="clients" element={<Clients />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="billing" element={<Billing />} />
        <Route path="income-tax" element={<IncomeTaxProcessing />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
