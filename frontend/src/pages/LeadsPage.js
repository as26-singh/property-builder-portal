import { useEffect, useState } from "react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";
import TableToolbar, { Pagination, useFilteredList } from "../components/TableToolbar";

const STATUSES = ["new", "contacted", "interested", "visit_scheduled", "visited", "negotiation", "reserved", "booked", "sold"];

export default function LeadsPage({ admin = false }) {
  const [leads, setLeads] = useState([]);
  const [associates, setAssociates] = useState([]);

  const load = () => api.get(admin ? "/admin/leads" : "/associate/leads").then((r) => setLeads(r.data));

  useEffect(() => {
    load();
    if (admin) api.get("/admin/associates").then((r) => setAssociates(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (id, status) => {
    await api.patch(`/associate/leads/${id}/status`, { status });
    load();
  };
  const assign = async (e, id) => {
    await api.patch(`/admin/leads/${id}/assign`, { associate_id: e.target.value });
    load();
  };

  const {
    q, setQ, status, setStatus, page, setPage, totalPages, paged, filtered,
  } = useFilteredList(leads, { searchKeys: ["name", "phone", "email", "message"], pageSize: 10 });

  return (
    <PortalLayout title={admin ? "Admin" : "Associate"}>
      <>
        {admin ? "Lead pipeline" : "My leads"}
        <div className="dashboard-content">
          <div className="page-toolbar">
            <div>
              <div className="section-kicker">{filtered.length} active records</div>
              <h2>{admin ? "All enquiries" : "People to follow up"}</h2>
            </div>
          </div>
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
                  <select value={l.status} onChange={(e) => update(l.id, e.target.value)} data-testid={`lead-status-${l.id}`}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          {!paged.length && <div className="empty-state">No leads match your filters.</div>}
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </>
    </PortalLayout>
  );
}
