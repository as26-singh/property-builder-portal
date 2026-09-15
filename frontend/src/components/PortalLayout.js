import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { CalendarDays, ClipboardList, Home, LogOut, MapPin, Users } from "lucide-react";
import Brand from "./Brand";
import { useAuth } from "../auth";

export default function PortalLayout({ children, title }) {
  const { user, logout, checking } = useAuth();
  const navigate = useNavigate();
  const admin = title === "Admin";
  if (checking) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to={admin ? "/admin/login" : "/associate/login"} />;
  if ((admin && user.role !== "super_admin") || (!admin && user.role !== "associate")) {
    return <Navigate to={admin ? "/associate/dashboard" : "/admin/dashboard"} replace />;
  }
  const links = admin
    ? [
        ["Dashboard", "/admin/dashboard", Home],
        ["Leads", "/admin/leads", Users],
        ["Reservations", "/admin/reservations", ClipboardList],
      ]
    : [
        ["Dashboard", "/associate/dashboard", Home],
        ["My leads", "/associate/leads", Users],
        ["Site visits", "/associate/site-visits", CalendarDays],
        ["Properties", "/associate/properties", MapPin],
      ];
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <Link to="/" className="brand"><Brand /></Link>
        <div className="portal-role">{admin ? "ADMIN CONSOLE" : "ASSOCIATE PORTAL"}</div>
        <nav className="portal-nav">
          {links.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} data-testid={`portal-nav-${label.toLowerCase().replaceAll(" ", "-")}`}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user.name?.charAt(0)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{admin ? "Super admin" : "Associate"}</span>
          </div>
          <button
            className="icon-button"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            data-testid="logout-button"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="portal-main">
        <div className="portal-top">
          <div>
            <span className="muted-label">{admin ? "Admin workspace" : "Your workspace"}</span>
            <h1>{children}</h1>
          </div>
          <div className="portal-date">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </main>
    </div>
  );
}
