import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { authRegister } from "../api";

const formStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: "3rem auto",
  background: "var(--surface)",
  padding: "2rem",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
};

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await authRegister(username, password, displayName || undefined);
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

  return (
    <div style={formStyle}>
      <h2 style={{ marginBottom: "1.5rem" }}>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </div>
        <div className="field">
          <label>Display Name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {err && <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{err}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "..." : "Register"}
        </button>
      </form>
      <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text2)", marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
