import { useEffect, useState } from "react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";

export default function VisitsPortalPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/associate/site-visits").then((r) => setItems(r.data));
  }, []);
  return (
    <PortalLayout title="Associate">
      My site visits
      <div className="dashboard-content">
        <div className="section-kicker">{items.length} records</div>
        <h2>Upcoming conversations</h2>
        <div className="property-table portal-table">
          {items.map((x) => (
            <div className="property-row" key={x.id} data-testid={`visits-row-${x.id}`}>
              <div>
                <strong>{x.visit_date}</strong>
                <span>{x.preferred_time || "Scheduled"}</span>
              </div>
              <span className={`status status-${x.status}`}>{x.status}</span>
              <span>{x.notes || "—"}</span>
            </div>
          ))}
          {!items.length && <div className="empty-state">No site visits scheduled yet.</div>}
        </div>
      </div>
    </PortalLayout>
  );
}
