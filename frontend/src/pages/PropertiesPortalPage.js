import { useEffect, useState } from "react";
import { api } from "../api";
import PortalLayout from "../components/PortalLayout";
import Button from "../components/Button";
import TableToolbar, { Pagination, useFilteredList } from "../components/TableToolbar";

const STATUSES = ["available", "reserved", "booked", "sold"];

export default function PropertiesPortalPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/associate/properties").then((r) => setItems(r.data));
  }, []);

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
              {x.status === "available" && (
                <Button secondary to="/contact" testid={`property-enquire-${x.id}`}>
                  Reserve via lead
                </Button>
              )}
            </div>
          ))}
          {!paged.length && <div className="empty-state">No properties match your filters.</div>}
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </PortalLayout>
  );
}
