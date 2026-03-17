import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { docsShare, DocFull } from "../api";
import { TagBadge } from "../components/TagInput";

export function SharedPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [accessorName, setAccessorName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (pw?: string) => {
    if (!id) return;
    setErr("");
    setLoading(true);
    try {
      const res = await docsShare(id, pw, accessorName || undefined);
      setDoc(res);
      setNeedsPassword(false);
    } catch (e: any) {
      if (e.message === "password required" || e.message === "incorrect password") {
        setNeedsPassword(true);
        if (pw) setErr("Incorrect password");
      } else {
        setErr(e.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <p style={{ color: "var(--text2)", padding: "2rem", textAlign: "center" }}>Loading...</p>;

  if (needsPassword) {
    return (
      <div style={{ maxWidth: 400, margin: "3rem auto", background: "var(--surface)", padding: "2rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
        <h2 style={{ marginBottom: "1rem" }}>Password Required</h2>
        <div className="field">
          <label>Your name (optional)</label>
          <input value={accessorName} onChange={(e) => setAccessorName(e.target.value)} placeholder="For audit log" />
        </div>
        <div className="field">
          <label>Document password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(password)} />
        </div>
        {err && <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{err}</p>}
        <button onClick={() => load(password)} style={{ width: "100%" }}>
          Unlock
        </button>
      </div>
    );
  }

  if (err) return <p style={{ color: "var(--danger)", padding: "2rem", textAlign: "center" }}>{err}</p>;
  if (!doc) return null;

  return (
    <div>
      <h2 style={{ marginBottom: "0.5rem" }}>{doc.title}</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {doc.tags.map((t) => (
          <TagBadge key={t.id} name={t.name} />
        ))}
        <span style={{ fontSize: "0.8rem", color: "var(--text2)", marginLeft: "auto" }}>
          Updated {new Date(doc.updated_at).toLocaleString()}
        </span>
      </div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
          lineHeight: 1.8,
        }}
      >
        <ReactMarkdown>{doc.content}</ReactMarkdown>
      </div>
    </div>
  );
}
