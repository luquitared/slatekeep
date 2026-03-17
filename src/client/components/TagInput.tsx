import { useState, KeyboardEvent } from "react";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const tagStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "0.2rem 0.6rem",
  fontSize: "0.8rem",
  color: "var(--accent)",
};

export function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState("");

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
        {tags.map((t) => (
          <span key={t} style={tagStyle}>
            {t}
            <button
              onClick={() => onChange(tags.filter((x) => x !== t))}
              style={{
                background: "none",
                border: "none",
                color: "var(--text2)",
                padding: 0,
                cursor: "pointer",
                fontSize: "0.9rem",
                lineHeight: 1,
              }}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type tag and press Enter"
        style={{ fontSize: "0.85rem" }}
      />
    </div>
  );
}

export function TagBadge({ name }: { name: string }) {
  return <span style={tagStyle}>{name}</span>;
}
