import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export function useFilteredList(items, { searchKeys = [], statusKey = "status", pageSize = 10 } = {}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items || []).filter((item) => {
      if (status && item[statusKey] !== status) return false;
      if (needle && !searchKeys.some((k) => String(item[k] ?? "").toLowerCase().includes(needle))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, status, statusKey, searchKeys.join(",")]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return { q, setQ, status, setStatus, page: currentPage, setPage, totalPages, paged, filtered };
}

export default function TableToolbar({ q, setQ, status, setStatus, statuses = [], placeholder = "Search…", total = 0, filtered = 0 }) {
  return (
    <div className="table-toolbar">
      <label className="toolbar-search">
        <Search size={15} />
        <input
          type="search"
          data-testid="toolbar-search"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {statuses.length > 0 && (
        <select
          className="toolbar-filter"
          data-testid="toolbar-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      <span className="toolbar-count" data-testid="toolbar-count">
        {filtered} of {total}
      </span>
    </div>
  );
}

export function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination" data-testid="pagination">
      <button
        type="button"
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        data-testid="pagination-prev"
      >
        Prev
      </button>
      <span className="pagination-info">
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        data-testid="pagination-next"
      >
        Next
      </button>
    </div>
  );
}
