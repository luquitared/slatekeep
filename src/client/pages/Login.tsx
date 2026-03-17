import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { authLogin, authAnonymous } from "../api";

const formStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: "3rem auto",
  background: "var(--surface)",
  padding: "2rem",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
};

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await authLogin(username, password);
      login(res.session, {
        id: res.user_id,
        username: res.username,
        display_name: res.display_name,
        is_anonymous: false,
      });
      navigate("/");
    } catch (e: any) {
      setErr(e.message);
    }
    setLoading(false);
  };

  const handleAnon = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await authAnonymous();
      login(res.session, {
        id: res.user_id,
        username: null,
        display_name: res.display_name,
        is_anonymous: true,
      });
      navigate("/");
    } catch (e: any) {
      setErr(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={formStyle}>
      <h2 style={{ marginBottom: "1.5rem" }}>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{err}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", marginBottom: "0.8rem" }}>
          {loading ? "..." : "Login"}
        </button>
      </form>
      <button onClick={handleAnon} className="secondary" disabled={loading} style={{ width: "100%", marginBottom: "1rem" }}>
        Continue as Guest
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text2)" }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
