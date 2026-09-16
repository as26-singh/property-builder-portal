import { useEffect, useState } from "react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";

export default function ReservationsPage() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/admin/reservations").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const [error, setError] = useState("");
  const decide = async (id, decision) => {
    setError("");
    try {
      await api.patch(`/admin/reservations/${id}`, { decision });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update the reservation");
    }
  };
  return (
    <PortalLayout title="Admin" heading="Reservation approvals">
      <div className="dashboard-content">
        <div className="section-kicker">{items.length} records</div>
        <h2>Pending decisions</h2>
        {error && <div className="form-error">{error}</div>}
        <div className="property-table portal-table">
          {items.map((x) => (
            <div className="property-row" key={x.id} data-testid={`reservation-row-${x.id}`}>
              <div>
                <strong>Property #{x.property_id?.slice(0, 8)}</strong>
                <span>Lead #{x.lead_id?.slice(0, 8)}</span>
              </div>
              <span className={`status status-${x.status}`}>{x.status}</span>
              {x.status === "pending" ? (
                <div className="row-actions">
                  <button className="button button-secondary" onClick={() => decide(x.id, "approve")} data-testid={`reservation-approve-${x.id}`}>
                    Approve
                  </button>
                  <button className="button button-secondary" onClick={() => decide(x.id, "reject")} data-testid={`reservation-reject-${x.id}`}>
                    Reject
                  </button>
                </div>
              ) : (
                <span>Reviewed</span>
              )}
            </div>
          ))}
          {!items.length && <div className="empty-state">No reservations yet.</div>}
        </div>
      </div>
    </PortalLayout>
  );
}
