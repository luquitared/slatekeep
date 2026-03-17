import { useState, useEffect } from "react";
import { keysCreate, keysList, keysDelete } from "../api";
import { useAuth } from "../auth";

interface ApiKeyInfo {
  id: string;
  key_prefix: string;
  label: string;
  created_at: string;
}

export function SettingsPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await keysList();
      setKeys(res.keys);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    const res = await keysCreate(newLabel);
    setNewKey(res.key);
    setNewLabel("");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    await keysDelete(id);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Settings</h2>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>Account</h3>
        <p>
          <strong>Display Name:</strong> {user?.display_name}
        </p>
        <p>
          <strong>Username:</strong> {user?.username || "(anonymous)"}
        </p>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>API Keys</h3>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Key label (e.g. my-chatbot)"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{ flex: 1 }}
          />
          <button onClick={handleCreate}>Create Key</button>
        </div>

        {newKey && (
          <div
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--success)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            <p style={{ color: "var(--success)", fontWeight: 600, marginBottom: "0.5rem" }}>
              Key created! Copy it now — it won't be shown again.
            </p>
            <code
              style={{ cursor: "pointer", wordBreak: "break-all" }}
              onClick={() => {
                navigator.clipboard.writeText(newKey);
              }}
            >
              {newKey}
            </code>
            <p style={{ color: "var(--text2)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Click to copy
            </p>
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--text2)" }}>Loading...</p>
        ) : keys.length === 0 ? (
          <p style={{ color: "var(--text2)" }}>No API keys yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {keys.map((k) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.6rem 0.8rem",
                  background: "var(--surface2)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.9rem",
                }}
              >
                <code>{k.key_prefix}...</code>
                <span style={{ flex: 1 }}>{k.label}</span>
                <span style={{ color: "var(--text2)", fontSize: "0.8rem" }}>
                  {new Date(k.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="danger"
                  style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
