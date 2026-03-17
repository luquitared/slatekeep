import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { EditorPage } from "./pages/Editor";
import { ViewPage } from "./pages/View";
import { AuditPage } from "./pages/Audit";
import { SettingsPage } from "./pages/Settings";
import { SharedPage } from "./pages/Shared";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export function App() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 960, width: "100%", margin: "0 auto", padding: "1.5rem" }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shared/:id" element={<SharedPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc/new"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc/:id/edit"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc/:id"
            element={
              <ProtectedRoute>
                <ViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc/:id/audit"
            element={
              <ProtectedRoute>
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
