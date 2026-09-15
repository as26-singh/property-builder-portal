import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import Brand from "../components/Brand";
import Button from "../components/Button";

export default function LoginPage({ role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to={user.role === "super_admin" ? "/admin/dashboard" : "/associate/dashboard"} />;
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/auth/login", { email, password });
      if (
        (role === "admin" && r.data.role !== "super_admin") ||
        (role === "associate" && r.data.role !== "associate")
      ) {
        throw new Error("This login is not available for this portal.");
      }
      setUser(r.data);
      navigate(role === "admin" ? "/admin/dashboard" : "/associate/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };
  return (
    <div className="portal-login">
      <div className="login-visual">
        <Link to="/" className="brand light-brand"><Brand light /></Link>
        <div>
          <div className="eyebrow light">
            <ShieldCheck size={14} /> {role === "admin" ? "Admin workspace" : "Associate workspace"}
          </div>
          <h1>Good work<br /><em>starts here.</em></h1>
        </div>
      </div>
      <form className="login-form" onSubmit={submit}>
        <div className="section-kicker">{role === "admin" ? "Team access" : "Partner access"}</div>
        <h2>Sign in to your workspace</h2>
        <p>Use the credentials provided by your administrator.</p>
        <label>
          Email address
          <input required type="email" data-testid="login-email-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input required type="password" data-testid="login-password-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="form-error" data-testid="login-error">{error}</div>}
        <Button type="submit" testid="login-submit-button">Sign in</Button>
        <Link to="/" className="text-link back-link">Return to website</Link>
      </form>
    </div>
  );
}
