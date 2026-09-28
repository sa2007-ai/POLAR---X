import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PolarProvider } from './context/PolarContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Operational Pages
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { ExpeditionsPage } from './pages/ExpeditionsPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { CargoPage } from './pages/CargoPage';
import { InventoryPage } from './pages/InventoryPage';
import { AssetsPage } from './pages/AssetsPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { ReportsPage } from './pages/ReportsPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { ConvoyMeshPage } from './pages/ConvoyMeshPage';
import { UavReconPage } from './pages/UavReconPage';
import { OfflineMapsPage } from './pages/OfflineMapsPage';
import { FieldSafetyPage } from './pages/FieldSafetyPage';
import { ReconstructionPage } from './pages/ReconstructionPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserManagementPage } from './pages/UserManagementPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PolarProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Operations Grid */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute module="dashboard">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="map"
                element={
                  <ProtectedRoute module="map">
                    <MapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="expeditions"
                element={
                  <ProtectedRoute module="expeditions">
                    <ExpeditionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="personnel"
                element={
                  <ProtectedRoute module="personnel">
                    <PersonnelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cargo"
                element={
                  <ProtectedRoute module="cargo">
                    <CargoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inventory"
                element={
                  <ProtectedRoute module="inventory">
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assets"
                element={
                  <ProtectedRoute module="assets">
                    <AssetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="emergency"
                element={
                  <ProtectedRoute module="emergency">
                    <EmergencyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute module="reports">
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="routes"
                element={
                  <ProtectedRoute module="routes">
                    <RoutePlannerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="telemetry"
                element={
                  <ProtectedRoute module="telemetry">
                    <TelemetryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="convoy"
                element={
                  <ProtectedRoute module="convoy">
                    <ConvoyMeshPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="uav"
                element={
                  <ProtectedRoute module="uav">
                    <UavReconPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="offline-maps"
                element={
                  <ProtectedRoute module="offline-maps">
                    <OfflineMapsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="field-safety"
                element={
                  <ProtectedRoute module="field-safety">
                    <FieldSafetyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reconstruction"
                element={
                  <ProtectedRoute module="reconstruction">
                    <ReconstructionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="user-management"
                element={
                  <ProtectedRoute module="users">
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="personnel-access"
                element={<Navigate to="/user-management" replace />}
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute module="settings">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PolarProvider>
    </AuthProvider>
  );
};

export default App;
