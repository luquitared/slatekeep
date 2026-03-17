import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { authLogout } from "../api";

const navStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderBottom: "1px solid var(--border)",
  padding: "0.7rem 1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
};

const brandStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "1.1rem",
  color: "var(--accent)",
  textDecoration: "none",
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch {
      // ignore
    }
    logout();
    navigate("/login");
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={brandStyle}>
        SlateKeep
      </Link>
      <div style={{ flex: 1 }} />
      {user ? (
        <>
          <Link to="/">Documents</Link>
          <Link to="/doc/new">New</Link>
          <Link to="/settings">Settings</Link>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer">API Docs</a>
          <span style={{ color: "var(--text2)", fontSize: "0.85rem" }}>
            {user.display_name || user.username}
          </span>
          <button
            onClick={handleLogout}
            className="secondary"
            style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
