import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { seedData } from "@/services/seed";

// Pages
import Login from "./pages/Login";
import RequestAccess from "./pages/RequestAccess";
import Dashboard from "./pages/Dashboard";
import SubmitPCC from "./pages/pcc/SubmitPCC";
import TrackStatus from "./pages/pcc/TrackStatus";
import ManagePCC from "./pages/pcc/ManagePCC";
import ModuleManagement from "./pages/admin/ModuleManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import FeatureUnavailable from "./pages/FeatureUnavailable";
import NotFound from "./pages/NotFound";
import WorkshopSurvey from "./pages/survey/WorkshopSurvey";
import WorkshopSurveyDashboard from "./pages/survey/WorkshopSurveyDashboard";
import APIRegistration from "./pages/api/APIRegistration";
import MTMeet from "./pages/mtmeet/MTMeet";
import WarrantySurveyDashboard from "./pages/survey/WarrantySurveyDashboard";
import TechnicalSurveyDashboard from "./pages/survey/TechnicalSurveyDashboard";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Only seed data in development mode
    if (import.meta.env.DEV) {
      seedData();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <FeatureFlagProvider>
            <Toaster />
            <Sonner />
           <BrowserRouter basename="/dealer-connect-not-working">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/request-access" element={<RequestAccess />} />
                
                {/* Protected Routes */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* PCC Routes */}
                  <Route path="pcc/submit" element={
                    <ProtectedRoute 
                      moduleKey="dealer_pcc"
                      roles={['master_technician', 'service_manager', 'service_head', 'warranty_manager']}
                    >
                      <SubmitPCC />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="pcc/track" element={
                    <ProtectedRoute moduleKey="dealer_pcc">
                      <TrackStatus />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="pcc/manage" element={
                    <ProtectedRoute 
                      moduleKey="dealer_pcc"
                      roles={['admin', 'super_admin']}
                    >
                      <ManagePCC />
                    </ProtectedRoute>
                  } />
                  
                  {/* API Registration Module */}
                  <Route path="api-registration" element={
                    <ProtectedRoute moduleKey="api_registration">
                      <APIRegistration />
                    </ProtectedRoute>
                  } />
                  
                  {/* MT Meet Module */}
                  <Route path="mt-meet" element={
                    <ProtectedRoute moduleKey="mt_meet">
                      <MTMeet />
                    </ProtectedRoute>
                  } />
                  
                  {/* Workshop Survey Module */}
                  <Route path="workshop-survey" element={
                    <ProtectedRoute moduleKey="workshop_survey">
                      <WorkshopSurveyDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="workshop-survey/submit" element={
                    <ProtectedRoute moduleKey="workshop_survey">
                      <WorkshopSurvey />
                    </ProtectedRoute>
                  } />
                  
                  {/* Warranty Survey Module */}
                  <Route path="warranty-survey" element={
                    <ProtectedRoute moduleKey="warranty_survey">
                      <WarrantySurveyDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Technical Awareness Survey Module */}
                  <Route path="technical-survey" element={
                    <ProtectedRoute moduleKey="technical_awareness_survey">
                      <TechnicalSurveyDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="modules" element={
                    <ProtectedRoute roles={['super_admin']}>
                      <ModuleManagement />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="audit-logs" element={
                    <ProtectedRoute roles={['admin', 'super_admin']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="users" element={
                    <ProtectedRoute roles={['admin', 'super_admin']}>
                      <FeatureUnavailable />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="access-requests" element={
                    <ProtectedRoute roles={['admin', 'super_admin']}>
                      <FeatureUnavailable />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </FeatureFlagProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
