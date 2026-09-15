import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api";
import PublicLayout from "../components/PublicLayout";
import PageIntro from "../components/PageIntro";
import TableToolbar, { Pagination, useFilteredList } from "../components/TableToolbar";

const STATUSES = ["available", "reserved", "booked", "sold"];

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  useEffect(() => {
    api.get("/public/properties").then((r) => setProperties(r.data));
  }, []);

  const {
    q, setQ, status, setStatus, page, setPage, totalPages, paged, filtered,
  } = useFilteredList(properties, { searchKeys: ["number", "size", "facing"], pageSize: 10 });

  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Available now"
        title={<>A place for every <em>possibility.</em></>}
        copy="Browse current availability and find a plot that feels right for your plans."
      />
      <section className="section">
        <TableToolbar
          q={q}
          setQ={setQ}
          status={status}
          setStatus={setStatus}
          statuses={STATUSES}
          placeholder="Search by number, size or facing…"
          total={properties.length}
          filtered={filtered.length}
        />
        <div className="property-table">
          {paged.map((p) => (
            <div className="property-row" key={p.id} data-testid={`public-property-${p.number}`}>
              <div>
                <strong>{p.number}</strong>
                <span>{p.size} · {p.facing} facing</span>
              </div>
              <strong>₹{(p.price / 100000).toFixed(1)}L</strong>
              <span className={`status status-${p.status}`}>{p.status}</span>
              <Link to="/contact" className="row-link">Enquire <ArrowRight size={15} /></Link>
            </div>
          ))}
          {!paged.length && <div className="empty-state">No properties match your filters.</div>}
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </section>
    </PublicLayout>
  );
}
