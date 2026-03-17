import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { docsGet, DocFull } from "../api";
import { TagBadge } from "../components/TagInput";

const contentStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1.5rem",
  lineHeight: 1.8,
};

export function ViewPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    docsGet(id)
      .then(setDoc)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!doc) return <p style={{ color: "var(--text2)" }}>Loading...</p>;

  const shareUrl = doc.is_public ? `${window.location.origin}/shared/${doc.id}` : null;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem", alignItems: "center" }}>
        <h2 style={{ flex: 1 }}>{doc.title}</h2>
        <Link to={`/doc/${doc.id}/edit`}>
          <button className="secondary">Edit</button>
        </Link>
        <Link to={`/doc/${doc.id}/audit`}>
          <button className="secondary">Audit Log</button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {doc.tags.map((t) => (
          <TagBadge key={t.id} name={t.name} />
        ))}
        {doc.is_public ? (
          <span style={{ fontSize: "0.8rem", color: "var(--success)" }}>Public</span>
        ) : null}
        {doc.has_password ? (
          <span style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Password protected</span>
        ) : null}
        <span style={{ fontSize: "0.8rem", color: "var(--text2)", marginLeft: "auto" }}>
          Updated {new Date(doc.updated_at).toLocaleString()}
        </span>
      </div>

      {shareUrl && (
        <div
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.6rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          Share link:{" "}
          <code
            style={{ cursor: "pointer", color: "var(--accent)" }}
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            {shareUrl}
          </code>{" "}
          <span style={{ color: "var(--text2)" }}>(click to copy)</span>
        </div>
      )}

      <div style={contentStyle}>
        <ReactMarkdown>{doc.content}</ReactMarkdown>
      </div>
    </div>
  );
}
