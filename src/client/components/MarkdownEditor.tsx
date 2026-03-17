import { useState } from "react";
import ReactMarkdown from "react-markdown";

const containerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
  minHeight: 400,
};

const previewStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1rem",
  overflow: "auto",
  minHeight: 200,
};

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function MarkdownEditor({ value, onChange }: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button
          className={tab === "edit" ? "" : "secondary"}
          onClick={() => setTab("edit")}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}
        >
          Edit
        </button>
        <button
          className={tab === "preview" ? "" : "secondary"}
          onClick={() => setTab("preview")}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}
        >
          Preview
        </button>
        <button
          className="secondary"
          onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
          style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem", marginLeft: "auto" }}
        >
          Split
        </button>
      </div>

      {tab === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight: 400, fontFamily: "monospace", fontSize: "0.9rem" }}
          placeholder="Write markdown here..."
        />
      ) : (
        <div style={previewStyle}>
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function SplitEditor({ value, onChange }: Props) {
  return (
    <div style={containerStyle}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
        placeholder="Write markdown here..."
      />
      <div style={previewStyle}>
        <ReactMarkdown>{value}</ReactMarkdown>
      </div>
    </div>
  );
}
