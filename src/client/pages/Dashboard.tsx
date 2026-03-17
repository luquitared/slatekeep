import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { docsList, docsDelete, grepSearch, DocSummary } from "../api";
import { TagBadge } from "../components/TagInput";

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

export function DashboardPage() {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; title: string; snippet: string }[] | null
  >(null);
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await docsList({ tag: tagFilter || undefined });
      setDocs(res.documents);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tagFilter]);

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await grepSearch(search, tagFilter || undefined);
      setSearchResults(res.results);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await docsDelete(id);
    load();
  };

  const displayDocs = searchResults ?? docs;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <h2 style={{ flex: 1 }}>Documents</h2>
        <Link to="/doc/new">
          <button>New Document</button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) setSearchResults(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1 }}
        />
        <button onClick={handleSearch} className="secondary">
          Search
        </button>
        <input
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          style={{ width: 160 }}
        />
      </div>

      {loading ? (
        <p style={{ color: "var(--text2)" }}>Loading...</p>
      ) : displayDocs.length === 0 ? (
        <p style={{ color: "var(--text2)" }}>
          {search ? "No results found." : "No documents yet."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {displayDocs.map((doc) => (
            <div key={doc.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <Link to={`/doc/${doc.id}`} style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {doc.title}
                </Link>
                {"is_public" in doc && doc.is_public ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>public</span>
                ) : null}
                {"has_password" in doc && doc.has_password ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>locked</span>
                ) : null}
              </div>
              {"snippet" in doc && (doc as any).snippet && (
                <p style={{ fontSize: "0.85rem", color: "var(--text2)", fontFamily: "monospace" }}>
                  {(doc as any).snippet}
                </p>
              )}
              {"tags" in doc && (doc as any).tags?.length > 0 && (
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {(doc as any).tags.map((t: { id: string; name: string }) => (
                    <TagBadge key={t.id} name={t.name} />
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text2)" }}>
                <span>Updated {new Date("updated_at" in doc ? (doc as any).updated_at : "").toLocaleDateString()}</span>
                <span style={{ flex: 1 }} />
                <Link to={`/doc/${doc.id}/edit`}>Edit</Link>
                <Link to={`/doc/${doc.id}/audit`}>Audit</Link>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    padding: 0,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
