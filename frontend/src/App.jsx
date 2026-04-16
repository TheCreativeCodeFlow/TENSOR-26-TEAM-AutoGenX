import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import ProfileSetup from "./pages/ProfileSetup.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import SafeDashboard from "./pages/SafeDashboard.jsx";
import DangerAlert from "./pages/DangerAlert.jsx";
import MapRiskZones from "./pages/MapRiskZones.jsx";
import AdvisoryDashboard from "./pages/AdvisoryDashboard.jsx";
import CycloneDashboard from "./pages/CycloneDashboard.jsx";
import HistoryLog from "./pages/HistoryLog.jsx";

function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function OnboardingGate({ children }) {
  const { loading, isAuthenticated, hasProfile } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function OnboardingRoute({ children }) {
  const { loading, isAuthenticated, hasProfile } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (hasProfile) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <ProfileSetup />
          </OnboardingRoute>
        }
      />
      <Route
        path="/"
        element={
          <OnboardingGate>
            <Layout />
          </OnboardingGate>
        }
      >
        <Route index element={<SafeDashboard />} />
        <Route path="advisory" element={<AdvisoryDashboard />} />
        <Route path="danger" element={<DangerAlert />} />
        <Route path="map" element={<MapRiskZones />} />
        <Route path="cyclone" element={<CycloneDashboard />} />
        <Route path="history" element={<HistoryLog />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
