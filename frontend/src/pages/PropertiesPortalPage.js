import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import TableToolbar, { Pagination, useFilteredList } from "../components/TableToolbar";

const STATUSES = ["available", "reserved", "booked", "sold"];

export default function PropertiesPortalPage() {
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [reserving, setReserving] = useState(null);
  const [chosenLead, setChosenLead] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = () => api.get("/associate/properties").then((r) => setItems(r.data));
  useEffect(() => {
    load();
    api.get("/associate/leads").then((r) => setLeads(r.data));
  }, []);

  const openReserve = (property) => {
    setReserving(property);
    setChosenLead("");
    setError("");
    setDone(false);
  };
  const submitReserve = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/associate/reservations", { property_id: reserving.id, lead_id: chosenLead });
      setDone(true);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reserve this property");
    }
  };
  const close = () => {
    setReserving(null);
    setTimeout(() => setDone(false), 250);
  };

  const {
    q, setQ, status, setStatus, page, setPage, totalPages, paged, filtered,
  } = useFilteredList(items, { searchKeys: ["number", "size", "facing"], pageSize: 10 });

  return (
    <PortalLayout title="Associate">
      Property availability
      <div className="dashboard-content">
        <div className="section-kicker">{filtered.length} records</div>
        <h2>Find the right fit</h2>
        <TableToolbar
          q={q}
          setQ={setQ}
          status={status}
          setStatus={setStatus}
          statuses={STATUSES}
          placeholder="Search by number, size or facing…"
          total={items.length}
          filtered={filtered.length}
        />
        <div className="property-table portal-table">
          {paged.map((x) => (
            <div className="property-row" key={x.id} data-testid={`properties-row-${x.id}`}>
              <div>
                <strong>{x.number}</strong>
                <span>{x.size} · {x.facing || "—"} facing</span>
              </div>
              <strong>₹{(x.price / 100000).toFixed(1)}L</strong>
              <span className={`status status-${x.status}`}>{x.status}</span>
              {x.status === "available" ? (
                <button
                  type="button"
                  className="button"
                  onClick={() => openReserve(x)}
                  data-testid={`property-reserve-${x.id}`}
                >
                  Reserve
                </button>
              ) : (
                <span className="row-muted">—</span>
              )}
            </div>
          ))}
          {!paged.length && <div className="empty-state">No properties match your filters.</div>}
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      <Modal
        open={!!reserving}
        onClose={close}
        title={done ? "Reservation submitted" : `Reserve ${reserving?.number || ""}`}
        testid="reserve-modal"
      >
        {done ? (
          <div className="modal-success">
            <CheckCircle2 size={40} />
            <p>Reservation submitted for admin approval.</p>
            <Button onClick={close} testid="reserve-modal-close">Close</Button>
          </div>
        ) : (
          <form className="lead-form modal-form" onSubmit={submitReserve}>
            <label>
              Choose lead
              <select required value={chosenLead} onChange={(e) => setChosenLead(e.target.value)} data-testid="reserve-modal-lead-select">
                <option value="">— Pick one of your leads —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>
                ))}
              </select>
            </label>
            {reserving && (
              <div className="reserve-summary">
                <strong>{reserving.number}</strong>
                <span>{reserving.size} · {reserving.facing} · ₹{(reserving.price / 100000).toFixed(1)}L</span>
              </div>
            )}
            {error && <div className="form-error" data-testid="reserve-modal-error">{error}</div>}
            <Button type="submit" testid="reserve-modal-submit">Submit reservation</Button>
          </form>
        )}
      </Modal>
    </PortalLayout>
  );
}
