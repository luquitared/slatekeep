import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { auditList } from "../api";

interface AuditEntry {
  id: string;
  accessor_name: string | null;
  accessor_type: string;
  action: string;
  ip_address: string | null;
  created_at: string;
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.6rem 0.8rem",
  borderBottom: "2px solid var(--border)",
  color: "var(--text2)",
  fontSize: "0.8rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "0.6rem 0.8rem",
  borderBottom: "1px solid var(--border)",
  fontSize: "0.9rem",
};

export function AuditPage() {
  const { id } = useParams();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await auditList(id, page);
      setEntries(res.entries);
    } catch (e: any) {
      setErr(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id, page]);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <h2>Audit Log</h2>
        <Link to={`/doc/${id}`}>
          <button className="secondary" style={{ fontSize: "0.85rem" }}>
            Back to Document
          </button>
        </Link>
      </div>

      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}

      {loading ? (
        <p style={{ color: "var(--text2)" }}>Loading...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "var(--text2)" }}>No audit entries yet.</p>
      ) : (
        <>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Who</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>IP</th>
                  <th style={thStyle}>When</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={tdStyle}>{e.accessor_name || "—"}</td>
                    <td style={tdStyle}>{e.accessor_type}</td>
                    <td style={tdStyle}>{e.action}</td>
                    <td style={tdStyle} title={e.ip_address || undefined}>
                      {e.ip_address ? e.ip_address.substring(0, 20) : "—"}
                    </td>
                    <td style={tdStyle}>{new Date(e.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
            <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Prev
            </button>
            <span style={{ padding: "0.5rem", color: "var(--text2)" }}>Page {page}</span>
            <button className="secondary" disabled={entries.length < 50} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
