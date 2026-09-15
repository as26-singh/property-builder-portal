import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "./auth";
import { SiteContentProvider } from "./content";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import PropertiesPage from "./pages/PropertiesPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import FormPage from "./pages/FormPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import PropertiesPortalPage from "./pages/PropertiesPortalPage";
import VisitsPortalPage from "./pages/VisitsPortalPage";
import ReservationsPage from "./pages/ReservationsPage";
import ContentStudio from "./pages/admin/ContentStudio";

export default function App() {
  return (
    <AuthProvider>
      <SiteContentProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<FormPage />} />
            <Route path="/book-site-visit" element={<FormPage visit />} />

            {/* Auth */}
            <Route path="/associate/login" element={<LoginPage role="associate" />} />
            <Route path="/admin/login" element={<LoginPage role="admin" />} />

            {/* Associate portal */}
            <Route path="/associate/dashboard" element={<Dashboard />} />
            <Route path="/associate/leads" element={<LeadsPage />} />
            <Route path="/associate/site-visits" element={<VisitsPortalPage />} />
            <Route path="/associate/properties" element={<PropertiesPortalPage />} />

            {/* Admin portal */}
            <Route path="/admin/dashboard" element={<Dashboard admin />} />
            <Route path="/admin/leads" element={<LeadsPage admin />} />
            <Route path="/admin/reservations" element={<ReservationsPage />} />
            <Route path="/admin/content" element={<ContentStudio />} />
          </Routes>
        </BrowserRouter>
      </SiteContentProvider>
    </AuthProvider>
  );
}
