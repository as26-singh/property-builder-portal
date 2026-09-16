import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import TableToolbar, { Pagination, useFilteredList } from "../components/TableToolbar";

const STATUSES = ["new", "contacted", "interested", "visit_scheduled", "visited", "negotiation", "reserved", "booked", "sold"];

export default function LeadsPage({ admin = false }) {
  const [leads, setLeads] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [visitLead, setVisitLead] = useState(null);
  const [visitDraft, setVisitDraft] = useState({});
  const [visitError, setVisitError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = () => api.get(admin ? "/admin/leads" : "/associate/leads").then((r) => setLeads(r.data));

  useEffect(() => {
    load();
    if (admin) api.get("/admin/associates").then((r) => setAssociates(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (fn) => {
    setActionError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "The update could not be saved. Please try again.");
    }
  };
  const update = (id, status) => runAction(() => api.patch(`/associate/leads/${id}/status`, { status }));
  const assign = (e, id) => runAction(() => api.patch(`/admin/leads/${id}/assign`, { associate_id: e.target.value || null }));

  const openVisit = (lead) => {
    setVisitLead(lead);
    setVisitDraft({ visit_date: "", preferred_time: "Morning", notes: "" });
    setVisitError("");
  };
  const submitVisit = async (e) => {
    e.preventDefault();
    setVisitError("");
    try {
      await api.post("/associate/site-visits", {
        lead_id: visitLead.id,
        project_id: visitLead.project_id,
        visit_date: visitDraft.visit_date,
        preferred_time: visitDraft.preferred_time,
        notes: visitDraft.notes,
      });
      setVisitLead(null);
      load();
    } catch (err) {
      setVisitError(err.response?.data?.detail || "Could not schedule the visit");
    }
  };

  const {
    q, setQ, status, setStatus, page, setPage, totalPages, paged, filtered,
  } = useFilteredList(leads, { searchKeys: ["name", "phone", "email", "message"], pageSize: 10 });

  return (
    <PortalLayout title={admin ? "Admin" : "Associate"} heading={admin ? "Lead pipeline" : "My leads"}>
      <>
        <div className="dashboard-content">
          <div className="page-toolbar">
            <div>
              <div className="section-kicker">{filtered.length} active records</div>
              <h2>{admin ? "All enquiries" : "People to follow up"}</h2>
            </div>
          </div>
          {actionError && <div className="form-error" data-testid="lead-action-error">{actionError}</div>}
          <TableToolbar
            q={q}
            setQ={setQ}
            status={status}
            setStatus={setStatus}
            statuses={STATUSES}
            placeholder="Search name, phone, email or note…"
            total={leads.length}
            filtered={filtered.length}
          />
          <div className="lead-list">
            {paged.map((l) => (
              <div className="lead-row" key={l.id} data-testid={`lead-row-${l.id}`}>
                <div className="lead-avatar">{l.name?.charAt(0)}</div>
                <div className="lead-main">
                  <strong>{l.name}</strong>
                  <span>{l.phone}{l.email && ` · ${l.email}`}</span>
                  <small>{l.message || "No note added yet"}</small>
                </div>
                <span className={`status status-${l.status}`}>{l.status}</span>
                {admin ? (
                  <select value={l.assigned_associate_id || ""} onChange={(e) => assign(e, l.id)} data-testid={`assign-lead-${l.id}`}>
                    <option value="">Assign associate</option>
                    {associates.map((a) => (
                      <option value={a.id} key={a.id}>{a.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="lead-actions">
                    <select value={l.status} onChange={(e) => update(l.id, e.target.value)} data-testid={`lead-status-${l.id}`}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="icon-button lead-visit-btn"
                      onClick={() => openVisit(l)}
                      aria-label="Schedule site visit"
                      title="Schedule site visit"
                      data-testid={`lead-schedule-visit-${l.id}`}
                    >
                      <CalendarPlus size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!paged.length && <div className="empty-state">No leads match your filters.</div>}
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>

        <Modal open={!!visitLead} onClose={() => setVisitLead(null)} title={`Schedule visit — ${visitLead?.name || ""}`} testid="visit-modal">
          <form className="lead-form modal-form" onSubmit={submitVisit}>
            <label>
              Visit date
              <input required type="date" data-testid="visit-modal-date" value={visitDraft.visit_date || ""} onChange={(e) => setVisitDraft({ ...visitDraft, visit_date: e.target.value })} />
            </label>
            <label>
              Preferred time
              <select data-testid="visit-modal-time" value={visitDraft.preferred_time} onChange={(e) => setVisitDraft({ ...visitDraft, preferred_time: e.target.value })}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </label>
            <label>
              Notes
              <textarea rows="3" data-testid="visit-modal-notes" value={visitDraft.notes || ""} onChange={(e) => setVisitDraft({ ...visitDraft, notes: e.target.value })} />
            </label>
            {visitError && <div className="form-error" data-testid="visit-modal-error">{visitError}</div>}
            <Button type="submit" testid="visit-modal-submit">Confirm visit</Button>
          </form>
        </Modal>
      </>
    </PortalLayout>
  );
}
