import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { api } from "../../api";
import PortalLayout from "../../components/PortalLayout";
import Button from "../../components/Button";
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
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "linkedin", label: "LinkedIn URL" },
];

const COLLECTIONS = {
  "hero-slides": {
    label: "Hero slides",
    fields: [
      { key: "image", label: "Image URL", required: true, placeholder: "https://…" },
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
    label: "Testimonials",
    fields: [
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "name", label: "Author name", required: true },
      { key: "role", label: "Role / project" },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => `${s.name} — ${s.role || ""}`,
  },
  "trust-pillars": {
    label: "Trust pillars",
    fields: [
      { key: "icon", label: "Lucide icon name", required: true, placeholder: "ShieldCheck" },
      { key: "title", label: "Pillar title", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "order", label: "Order", type: "number" },
    ],
    summary: (s) => s.title,
  },
  "property-types": {
    label: "Property types",
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
  { key: "general", label: "General" },
  ...Object.entries(COLLECTIONS).map(([k, v]) => ({ key: k, label: v.label })),
];

function Field({ field, value, onChange }) {
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
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/content/${collectionKey}`).then((r) => setItems(r.data));

  useEffect(() => {
    load();
    setEditing(null);
    setDraft({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionKey]);

  const startNew = () => {
    setDraft(Object.fromEntries(spec.fields.map((f) => [f.key, f.type === "number" ? items.length : ""])));
    setEditing("new");
  };
  const startEdit = (item) => {
    setDraft({ ...item });
    setEditing(item.id);
  };
  const cancel = () => {
    setEditing(null);
    setDraft({});
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing === "new") {
        await api.post(`/admin/content/${collectionKey}`, draft);
      } else {
        await api.patch(`/admin/content/${collectionKey}/${editing}`, draft);
      }
      await load();
      onSaved?.();
      cancel();
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    try {
      await api.delete(`/admin/content/${collectionKey}/${id}`);
      await load();
      onSaved?.();
    } finally {
      setBusy(false);
    }
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

      {editing && (
        <form className="content-edit" onSubmit={save} data-testid="content-edit-form">
          <div className="content-edit-head">
            <h3>{editing === "new" ? `New ${spec.label.slice(0, -1)}` : `Edit ${spec.label.slice(0, -1)}`}</h3>
            <button type="button" className="icon-button" onClick={cancel} aria-label="Cancel">
              <X size={18} />
            </button>
          </div>
          <div className="content-grid">
            {spec.fields.map((f) => (
              <Field key={f.key} field={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
            ))}
          </div>
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

export default function ContentStudio() {
  const [tab, setTab] = useState("general");
  const { refresh } = useSiteContent();
  const onSaved = () => refresh();
  return (
    <PortalLayout title="Admin">
      Content Studio
      <div className="dashboard-content">
        <div className="section-kicker">Configure the website live</div>
        <h2>Every section, editable.</h2>
        <div className="content-tabs" role="tablist" data-testid="content-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`content-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
              data-testid={`content-tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "general" ? <SettingsPanel onSaved={onSaved} /> : <CollectionPanel collectionKey={tab} onSaved={onSaved} />}
      </div>
    </PortalLayout>
  );
}
