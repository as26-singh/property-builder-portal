import { useState } from "react";
import { Upload, X as XIcon } from "lucide-react";
import { api, API } from "../api";

const MEDIA_BASE = process.env.REACT_APP_BACKEND_URL || "";

export function toAbsoluteUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/api/")) return `${MEDIA_BASE}${value}`;
  return value;
}

export default function UploadField({ label, value, onChange, accept = "image/*", category = "documents", testid, hint }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      const r = await api.post("/admin/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(r.data.url ? `${MEDIA_BASE}${r.data.url}` : "");
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isImage = accept.includes("image");
  const preview = toAbsoluteUrl(value);

  return (
    <div className="content-field">
      <span>{label}</span>
      {hint && <em className="upload-hint">{hint}</em>}
      <div className="upload-row">
        <input
          type="url"
          data-testid={testid}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL or upload…"
        />
        <label className="button button-secondary upload-btn">
          <input
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && upload(e.target.files[0])}
            data-testid={`${testid}-file`}
          />
          <Upload size={14} />
          {uploading ? "Uploading…" : "Upload"}
        </label>
        {value && (
          <button type="button" className="icon-button" onClick={() => onChange("")} aria-label="Clear" data-testid={`${testid}-clear`}>
            <XIcon size={16} />
          </button>
        )}
      </div>
      {value && (
        <div className="upload-preview">
          {isImage ? <img src={preview} alt="preview" /> : <a href={preview} target="_blank" rel="noreferrer">Open file →</a>}
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
