import { useEffect, useState } from "react";
import {
  Building2, Image as ImageIcon, Images, LayoutGrid, MapPin, Plus, Quote, Save, ShieldCheck,
  SlidersHorizontal, Trash2, Users, X,
} from "lucide-react";
import { api } from "../../api";
import PortalLayout from "../../components/PortalLayout";
import UploadField, { toAbsoluteUrl } from "../../components/UploadField";
import { useSiteContent } from "../../content";

const SETTINGS_FIELDS = [
  { key: "phone", label: "Phone number", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", placeholder: "hello@nirnaygroup.com" },
  { key: "address", label: "Office address" },
  { key: "tagline_en", label: "Tagline (English)" },
  { key: "tagline_hi", label: "Tagline (Hindi / Local)" },
  { key: "intro_title", label: "Home intro title" },
  { key: "intro_copy", label: "Home intro copy", type: "textarea" },
  { key: "phone_band_title", label: "Phone band title" },
  { key: "phone_band_copy", label: "Phone band copy", type: "textarea" },
  { key: "footer_copy", label: "Footer tagline" },
  { key: "office_hours", label: "Office hours (one per line: Day|Hours)", type: "textarea", hint: "One per line, format: Monday|10:00 am – 6:00 pm" },
  { key: "about_links", label: "About links (one per line: Label|URL)", type: "textarea", hint: "Example: About Company|/about" },
  { key: "quick_links", label: "Quick links (one per line: Label|URL)", type: "textarea", hint: "Example: Careers|/contact" },
  { key: "terms_url", label: "Terms of Use URL" },
  { key: "privacy_url", label: "Privacy Policy URL" },
  { key: "copyright_text", label: "Copyright line" },
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "linkedin", label: "LinkedIn URL" },
];

const COLLECTIONS = {
  "hero-slides": {
    label: "Hero slides", singular: "hero slide",
    fields: [
      { key: "image", label: "Image URL", required: true, upload: "image/*" },
      { key: "kicker", label: "Small kicker" },
      { key: "title", label: "Headline", required: true },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "cta_label", label: "CTA label", placeholder: "Explore projects" },
      { key: "cta_link", label: "CTA link", placeholder: "/projects" },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => s.title,
  },
  testimonials: {
    label: "Testimonials", singular: "testimonial",
    fields: [
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "name", label: "Author name", required: true },
      { key: "role", label: "Role / project" },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => `${s.name} — ${s.role || ""}`,
  },
  "trust-pillars": {
    label: "Trust pillars", singular: "trust pillar",
    fields: [
      { key: "icon", label: "Lucide icon name", required: true, placeholder: "ShieldCheck" },
      { key: "title", label: "Pillar title", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => s.title,
  },
  "property-types": {
    label: "Property types", singular: "property type",
    fields: [
      { key: "icon", label: "Lucide icon name", required: true, placeholder: "Home" },
      { key: "name", label: "Type name", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => s.name,
  },
};

const TABS = [
  { key: "general", label: "General", icon: SlidersHorizontal, description: "Contact details, taglines, footer and homepage copy." },
  { key: "hero-slides", label: "Hero slides", icon: Images, description: "The full-screen carousel at the top of the homepage." },
  { key: "projects", label: "Projects", icon: Building2, description: "Developments listed on the website, with brochures and master plans." },
  { key: "properties", label: "Properties", icon: MapPin, description: "Plots and units inside each project, with pricing and availability." },
  { key: "associates", label: "Associates", icon: Users, description: "Sales associates who can log in and work leads." },
  { key: "gallery", label: "Gallery", icon: ImageIcon, description: "Photos shown on the public gallery page." },
  { key: "testimonials", label: "Testimonials", icon: Quote, description: "Customer quotes on the homepage." },
  { key: "trust-pillars", label: "Trust pillars", icon: ShieldCheck, description: "The three reasons-to-believe under the hero." },
  { key: "property-types", label: "Property types", icon: LayoutGrid, description: "Categories of property you offer." },
];

function Field({ field, value, onChange }) {
  if (field.upload) {
    return <UploadField label={field.label} value={value} onChange={onChange} accept={field.upload} testid={`content-field-${field.key}`} />;
  }
  const shared = {
    "data-testid": `content-field-${field.key}`,
    value: value ?? "",
    onChange: (e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value),
    placeholder: field.placeholder || "",
    required: field.required,
  };
  return (
    <label className="content-field">
      <span>{field.label}{field.required && <em> *</em>}</span>
      {field.hint && <em className="upload-hint">{field.hint}</em>}
      {field.type === "textarea" ? <textarea rows="3" {...shared} /> : <input type={field.type === "number" ? "number" : "text"} {...shared} />}
    </label>
  );
}

function SettingsPanel({ onSaved }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then((r) => setSettings(r.data || {}));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const r = await api.put("/admin/settings", settings);
      setSettings(r.data);
      setMsg("Saved.");
      onSaved?.();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="loading">Loading settings…</div>;
  return (
    <form className="content-panel" onSubmit={save}>
      <div className="content-grid">
        {SETTINGS_FIELDS.map((f) => (
          <Field key={f.key} field={f} value={settings[f.key]} onChange={(v) => setSettings({ ...settings, [f.key]: v })} />
        ))}
      </div>
      <div className="content-actions">
        <button type="submit" className="button" disabled={saving} data-testid="settings-save-button">
          <Save size={16} /> {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="content-msg" data-testid="settings-save-msg">{msg}</span>}
      </div>
    </form>
  );
}

function CollectionPanel({ collectionKey, onSaved }) {
  const spec = COLLECTIONS[collectionKey];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get(`/admin/content/${collectionKey}`).then((r) => setItems(r.data)).catch(() => setError("Could not load items"));

  useEffect(() => {
    load();
    setEditing(null);
    setDraft({});
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionKey]);

  const startNew = () => {
    setDraft(Object.fromEntries(spec.fields.map((f) => [f.key, f.type === "number" ? items.length : ""])));
    setEditing("new");
    setError("");
  };
  const startEdit = (item) => {
    setDraft({ ...item });
    setEditing(item.id);
    setError("");
  };
  const cancel = () => { setEditing(null); setDraft({}); setError(""); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing === "new") await api.post(`/admin/content/${collectionKey}`, draft);
      else await api.patch(`/admin/content/${collectionKey}/${editing}`, draft);
      await load();
      onSaved?.();
      cancel();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/admin/content/${collectionKey}/${id}`);
      await load();
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="content-panel">
      <div className="content-list-head">
        <span className="section-kicker">{items.length} {spec.label.toLowerCase()}</span>
        <button className="button button-secondary" onClick={startNew} data-testid={`content-new-${collectionKey}`}>
          <Plus size={16} /> New
        </button>
      </div>
      <div className="content-list">
        {items.map((item) => (
          <div className="content-item" key={item.id} data-testid={`content-item-${item.id}`}>
            <div className="content-item-summary">
              <strong>#{item.order ?? 0}</strong>
              <span>{spec.summary(item)}</span>
            </div>
            <div className="row-actions">
              <button className="button button-secondary" onClick={() => startEdit(item)} data-testid={`content-edit-${item.id}`}>Edit</button>
              <button className="icon-button" onClick={() => remove(item.id)} aria-label="Delete" data-testid={`content-delete-${item.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!items.length && <div className="empty-state">No items yet. Click New to add one.</div>}
      </div>
      {error && !editing && <div className="form-error" data-testid="content-error">{error}</div>}
      {editing && (
        <form className="content-edit" onSubmit={save} data-testid="content-edit-form">
          <div className="content-edit-head">
            <h3>{editing === "new" ? `New ${spec.singular}` : `Edit ${spec.singular}`}</h3>
            <button type="button" className="icon-button" onClick={cancel} aria-label="Cancel">
              <X size={18} />
            </button>
          </div>
          <div className="content-grid">
            {spec.fields.map((f) => (
              <Field key={f.key} field={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>
          {error && <div className="form-error" data-testid="content-error">{error}</div>}
          <div className="content-actions">
            <button type="submit" className="button" disabled={busy} data-testid="content-save-item">
              <Save size={16} /> {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className="button button-secondary" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

const PROJECT_FIELDS = [
  { key: "slug", label: "URL slug", placeholder: "verdant-meadows", required: true },
  { key: "name", label: "Project name", required: true },
  { key: "location", label: "Location" },
  { key: "tagline", label: "One-line tagline" },
  { key: "status", label: "Status", placeholder: "selling / sold-out / coming-soon" },
  { key: "area", label: "Area", placeholder: "18 acres" },
  { key: "price_from", label: "Price from (₹)", type: "number" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "image", label: "Cover image", upload: "image/*" },
  { key: "master_plan_url", label: "Master plan image", upload: "image/*" },
  { key: "brochure_url", label: "Brochure PDF", upload: "application/pdf,image/*" },
];

function ProjectsPanel({ onSaved }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/admin/projects").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const startNew = () => {
    setDraft({ slug: "", name: "", location: "", tagline: "", description: "", price_from: 0, area: "", status: "selling", image: "", master_plan_url: "", brochure_url: "" });
    setEditing("new");
    setError("");
  };
  const startEdit = (item) => { setDraft({ ...item }); setEditing(item.id); setError(""); };
  const cancel = () => { setEditing(null); setDraft({}); setError(""); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...draft, price_from: Number(draft.price_from || 0) };
      if (editing === "new") await api.post("/admin/projects", payload);
      else await api.patch(`/admin/projects/${editing}`, payload);
      await load();
      onSaved?.();
      cancel();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this project and ALL its properties?")) return;
    setBusy(true);
    try {
      await api.delete(`/admin/projects/${id}`);
      await load();
      onSaved?.();
    } finally { setBusy(false); }
  };

  return (
    <div className="content-panel">
      <div className="content-list-head">
        <span className="section-kicker">{items.length} projects</span>
        <button className="button button-secondary" onClick={startNew} data-testid="projects-new">
          <Plus size={16} /> New project
        </button>
      </div>
      <div className="content-list">
        {items.map((p) => (
          <div className="content-item" key={p.id} data-testid={`project-item-${p.id}`}>
            <div className="content-item-summary">
              <strong>{p.slug}</strong>
              <span>{p.name} — {p.location || "—"}</span>
            </div>
            <div className="row-actions">
              <button className="button button-secondary" onClick={() => startEdit(p)} data-testid={`project-edit-${p.id}`}>Edit</button>
              <button className="icon-button" onClick={() => remove(p.id)} aria-label="Delete" data-testid={`project-delete-${p.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!items.length && <div className="empty-state">No projects yet.</div>}
      </div>
      {editing && (
        <form className="content-edit" onSubmit={save} data-testid="project-edit-form">
          <div className="content-edit-head">
            <h3>{editing === "new" ? "New project" : "Edit project"}</h3>
            <button type="button" className="icon-button" onClick={cancel} aria-label="Cancel">
              <X size={18} />
            </button>
          </div>
          <div className="content-grid">
            {PROJECT_FIELDS.map((f) => (
              <Field key={f.key} field={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>
          {error && <div className="form-error" data-testid="project-error">{error}</div>}
          <div className="content-actions">
            <button type="submit" className="button" disabled={busy} data-testid="project-save">
              <Save size={16} /> {busy ? "Saving…" : "Save project"}
            </button>
            <button type="button" className="button button-secondary" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function PropertiesPanel() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/projects").then((r) => {
      setProjects(r.data);
      if (r.data.length && !projectId) setProjectId(r.data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (!projectId) return;
    api.get(`/admin/properties?project_id=${projectId}`).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); setEditing(null); setDraft({}); /* eslint-disable-next-line */ }, [projectId]);

  const startNew = () => {
    setDraft({ number: "", size: "", price: 0, status: "available", facing: "East" });
    setEditing("new");
    setError("");
  };
  const startEdit = (p) => { setDraft({ ...p }); setEditing(p.id); setError(""); };
  const cancel = () => { setEditing(null); setDraft({}); setError(""); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...draft, project_id: projectId, price: Number(draft.price || 0) };
      if (editing === "new") await api.post("/admin/properties", payload);
      else await api.patch(`/admin/properties/${editing}`, payload);
      load();
      cancel();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    setError("");
    try {
      await api.delete(`/admin/properties/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="content-panel">
      <div className="content-list-head">
        <label className="content-field" style={{ minWidth: 260 }}>
          <span>Project</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} data-testid="properties-project-select">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <button className="button button-secondary" onClick={startNew} disabled={!projectId} data-testid="properties-new">
          <Plus size={16} /> New property
        </button>
      </div>
      <div className="content-list">
        {items.map((p) => (
          <div className="content-item" key={p.id} data-testid={`property-admin-${p.id}`}>
            <div className="content-item-summary">
              <strong>{p.number}</strong>
              <span>{p.size} · ₹{(p.price / 100000).toFixed(1)}L · {p.facing} · {p.status}</span>
            </div>
            <div className="row-actions">
              <button className="button button-secondary" onClick={() => startEdit(p)} data-testid={`property-edit-${p.id}`}>Edit</button>
              <button className="icon-button" onClick={() => remove(p.id)} aria-label="Delete" data-testid={`property-delete-${p.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!items.length && projectId && <div className="empty-state">No properties in this project yet.</div>}
      </div>
      {editing && (
        <form className="content-edit" onSubmit={save} data-testid="property-edit-form">
          <div className="content-edit-head">
            <h3>{editing === "new" ? "New property" : "Edit property"}</h3>
            <button type="button" className="icon-button" onClick={cancel}><X size={18} /></button>
          </div>
          <div className="content-grid">
            <Field field={{ key: "number", label: "Plot / Unit number", required: true }} value={draft.number} onChange={(v) => setDraft({ ...draft, number: v })} />
            <Field field={{ key: "size", label: "Size", placeholder: "1200 sq.ft" }} value={draft.size} onChange={(v) => setDraft({ ...draft, size: v })} />
            <Field field={{ key: "price", label: "Price (₹)", type: "number" }} value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} />
            <Field field={{ key: "facing", label: "Facing", placeholder: "East / North / West" }} value={draft.facing} onChange={(v) => setDraft({ ...draft, facing: v })} />
            <Field field={{ key: "status", label: "Status", placeholder: "available / reserved / booked / sold" }} value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="content-actions">
            <button type="submit" className="button" disabled={busy} data-testid="property-save"><Save size={16} /> {busy ? "Saving…" : "Save"}</button>
            <button type="button" className="button button-secondary" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function AssociatesPanel() {
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/admin/associates").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/associates", draft);
      setDraft({ name: "", email: "", password: "" });
      setAdding(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create associate");
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Remove this associate? Their assigned leads will become unassigned.")) return;
    setError("");
    try {
      await api.delete(`/admin/associates/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not remove associate");
    }
  };

  return (
    <div className="content-panel">
      <div className="content-list-head">
        <span className="section-kicker">{items.length} associates</span>
        <button className="button button-secondary" onClick={() => setAdding((v) => !v)} data-testid="associates-new">
          <Plus size={16} /> {adding ? "Cancel" : "New associate"}
        </button>
      </div>
      {adding && (
        <form className="content-edit" onSubmit={save} data-testid="associate-edit-form">
          <div className="content-edit-head">
            <h3>New associate</h3>
            <button type="button" className="icon-button" onClick={() => setAdding(false)}><X size={18} /></button>
          </div>
          <div className="content-grid">
            <Field field={{ key: "name", label: "Full name", required: true }} value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field field={{ key: "email", label: "Email", required: true }} value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
            <Field field={{ key: "password", label: "Initial password (min 8 chars)", required: true }} value={draft.password} onChange={(v) => setDraft({ ...draft, password: v })} />
          </div>
          {error && <div className="form-error" data-testid="associate-error">{error}</div>}
          <div className="content-actions">
            <button type="submit" className="button" disabled={busy} data-testid="associate-save"><Save size={16} /> {busy ? "Saving…" : "Create associate"}</button>
          </div>
        </form>
      )}
      <div className="content-list">
        {items.map((a) => (
          <div className="content-item" key={a.id} data-testid={`associate-admin-${a.id}`}>
            <div className="content-item-summary">
              <strong>{a.name}</strong>
              <span>{a.email}</span>
            </div>
            <div className="row-actions">
              <button className="icon-button" onClick={() => remove(a.id)} aria-label="Remove" data-testid={`associate-delete-${a.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {!items.length && <div className="empty-state">No associates yet.</div>}
      </div>
    </div>
  );
}

function GalleryPanel() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/admin/gallery").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "gallery");
      await api.post("/admin/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally { setUploading(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    setError("");
    try {
      await api.delete(`/admin/gallery/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="content-panel">
      <div className="content-list-head">
        <span className="section-kicker">{items.length} images</span>
        <label className="button" data-testid="gallery-upload-label">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && upload(e.target.files[0])}
            data-testid="gallery-upload-input"
          />
          <Plus size={16} /> {uploading ? "Uploading…" : "Upload image"}
        </label>
      </div>
      {error && <div className="form-error" data-testid="gallery-upload-error">{error}</div>}
      <div className="gallery-admin-grid">
        {items.map((g) => (
          <div className="gallery-admin-item" key={g.id} data-testid={`gallery-item-${g.id}`}>
            <img src={toAbsoluteUrl(g.url)} alt={g.original_filename || "gallery"} />
            <button
              type="button"
              className="gallery-delete"
              onClick={() => remove(g.id)}
              aria-label="Delete image"
              data-testid={`gallery-delete-${g.id}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!items.length && <div className="empty-state">No images uploaded yet.</div>}
      </div>
    </div>
  );
}

export default function ContentStudio() {
  const [tab, setTab] = useState("general");
  const { refresh } = useSiteContent();
  const onSaved = () => refresh();
  const active = TABS.find((t) => t.key === tab) || TABS[0];
  return (
    <PortalLayout title="Admin" heading="Content Studio">
      <div className="dashboard-content">
        <div className="page-toolbar">
          <div className="section-kicker">Configure the website live</div>
          <h2>Every section, editable.</h2>
        </div>
        <div className="content-tabs" role="tablist" aria-label="Content sections" data-testid="content-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`content-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
                data-testid={`content-tab-${t.key}`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="content-tabpanel" role="tabpanel">
          <div className="content-tabpanel-head">
            <h3>{active.label}</h3>
            <p>{active.description}</p>
          </div>
          {tab === "general" && <SettingsPanel onSaved={onSaved} />}
          {tab === "projects" && <ProjectsPanel onSaved={onSaved} />}
          {tab === "properties" && <PropertiesPanel />}
          {tab === "associates" && <AssociatesPanel />}
          {tab === "gallery" && <GalleryPanel />}
          {COLLECTIONS[tab] && <CollectionPanel collectionKey={tab} onSaved={onSaved} />}
        </div>
      </div>
    </PortalLayout>
  );
}
