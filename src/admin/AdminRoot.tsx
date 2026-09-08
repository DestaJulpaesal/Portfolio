import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./AdminAuthContext";
import { ToastProvider } from "./ToastContext";
import { RequireAuth, RequireOwner } from "./RequireAuth";
import { AdminLayout } from "./AdminLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ProjectsAdmin } from "./pages/ProjectsAdmin";
import { CertificationsAdmin } from "./pages/CertificationsAdmin";
import { MessagesAdmin } from "./pages/MessagesAdmin";
import { ProfileAdmin } from "./pages/ProfileAdmin";
import { AboutAdmin } from "./pages/AboutAdmin";
import { SkillsAdmin } from "./pages/SkillsAdmin";
import { AdminsAdmin } from "./pages/AdminsAdmin";
import "./admin.css";

/**
 * Root untuk seluruh halaman /admin. Dipisah dari <App /> (situs publik)
 * supaya style, provider, dan bundle admin tidak ikut ke halaman publik.
 */
export function AdminRoot() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            path=""
            element={
              <RequireAuth>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="projects"
            element={
              <RequireAuth>
                <AdminLayout>
                  <ProjectsAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="certifications"
            element={
              <RequireAuth>
                <AdminLayout>
                  <CertificationsAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="messages"
            element={
              <RequireAuth>
                <AdminLayout>
                  <MessagesAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <AdminLayout>
                  <ProfileAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="about"
            element={
              <RequireAuth>
                <AdminLayout>
                  <AboutAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="skills"
            element={
              <RequireAuth>
                <AdminLayout>
                  <SkillsAdmin />
                </AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="admins"
            element={
              <RequireOwner>
                <AdminLayout>
                  <AdminsAdmin />
                </AdminLayout>
              </RequireOwner>
            }
          />
        </Routes>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
