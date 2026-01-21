import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateFPCRequest from './pages/CreateFPCRequest';
import ApprovalRequests from './pages/ApprovalRequests';
import MyRequests from './pages/MyRequests';
import CompleteProfile from './pages/CompleteProfile';
import AllFPCs from './pages/AllFPCs';
import FPOForm from './pages/FPOForm';
import LicenseForm from './pages/LicenseForm';
import FinancialForm from './pages/FinancialForm';
import ComplianceForm from './pages/ComplianceForm';
import RegionalManagers from './pages/RegionalManagers';
import ProjectManagers from './pages/ProjectManagers';
import PendingRequests from './pages/PendingRequests';
import RejectedFPOs from './pages/RejectedFPOs';
import { AuthProvider } from './contexts/AuthContext';
import ShareholdersPage from './pages/ShareholdersPage';
import StaffPage from './pages/StaffPage';
import BoardOfDirectors from './pages/BoardOfDirectors';
import TrainingsPage from './pages/TrainingsPage';  
import DonorsPage from './pages/DonorsPage';
import Agribusiness from './pages/Agribusiness';
import AgribusinessOfficer from './pages/AgribusinessOfficer';
import FacilitiesPage from './pages/FacilitiesPage';
import Profile from './pages/Profile';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="create-fpc" element={<CreateFPCRequest />} />
              <Route path="approvals" element={<ApprovalRequests />} />
              <Route path="my-requests" element={<MyRequests />} />
              <Route path="complete-profile" element={<CompleteProfile />} />
              <Route path="all-fpcs" element={<AllFPCs />} />
              <Route path="fpo-form" element={<FPOForm />} />
              <Route path="shareholder-form" element={<ShareholdersPage />} />
              <Route path="fpo-staff" element={<StaffPage />} />
              <Route path="license-form" element={<LicenseForm />} />
              <Route path="financial-form" element={<FinancialForm />} />
              <Route path="compliance-form" element={<ComplianceForm />} />
              <Route path="regional-managers" element={<RegionalManagers />} />
              <Route path="project-managers" element={<ProjectManagers />} />
              <Route path="pending-requests" element={<PendingRequests />} />
              <Route path="rejected-fpos" element={<RejectedFPOs />} />
              <Route path="board-of-directors" element={<BoardOfDirectors />} />
              <Route path="trainings" element={<TrainingsPage />} />
              <Route path="donors" element={<DonorsPage />} />
              <Route path="agribusiness" element={<Agribusiness />} />
              <Route path="agribusiness-officer" element={<AgribusinessOfficer />} />
              <Route path="facilities" element={<FacilitiesPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;