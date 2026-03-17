import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { docsCreate, docsGet, docsUpdate } from "../api";
import { MarkdownEditor } from "../components/MarkdownEditor";
import { TagInput } from "../components/TagInput";

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    docsGet(id)
      .then((doc) => {
        setTitle(doc.title);
        setContent(doc.content);
        setIsPublic(!!doc.is_public);
        setTags(doc.tags.map((t) => t.name));
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setErr("");
    setSaving(true);
    try {
      if (isNew) {
        const res = await docsCreate({
          title,
          content,
          password: password || undefined,
          is_public: isPublic ? "1" : "0",
          tags: tags.length ? tags.join(",") : undefined,
        });
        navigate(`/doc/${res.id}`);
      } else {
        await docsUpdate({
          doc_id: id!,
          title,
          content,
          password: password || undefined,
          is_public: isPublic ? "1" : "0",
        });
        navigate(`/doc/${id}`);
      }
    } catch (e: any) {
      setErr(e.message);
    }
    setSaving(false);
  };

  if (loading) return <p style={{ color: "var(--text2)" }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <h2>{isNew ? "New Document" : "Edit Document"}</h2>
        <span style={{ flex: 1 }} />
        <button onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="secondary" onClick={() => navigate(isNew ? "/" : `/doc/${id}`)}>
          Cancel
        </button>
      </div>

      {err && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{err}</p>}

      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
      </div>

      <div className="field">
        <label>Content</label>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      {isNew && (
        <div className="field">
          <label>Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      )}

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <div className="field">
          <label>Password (optional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isNew ? "Set password" : "Change password"}
            style={{ width: 250 }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "0.8rem" }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ width: "auto" }}
          />
          Public
        </label>
      </div>
    </div>
  );
}
