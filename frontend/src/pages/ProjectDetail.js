import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Download, FileText } from "lucide-react";
import { api } from "../api";
import PublicLayout from "../components/PublicLayout";
import Button from "../components/Button";

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  useEffect(() => {
    api.get(`/public/projects/${slug}`).then((r) => setProject(r.data));
  }, [slug]);
  if (!project) return <PublicLayout><div className="loading">Loading project…</div></PublicLayout>;
  return (
    <PublicLayout>
      <section className="detail-hero">
        <img src={project.image} alt={project.name} />
        <div className="detail-hero-copy">
          <div className="eyebrow light">{project.location}</div>
          <h1>{project.name}</h1>
          <p>{project.tagline}</p>
        </div>
      </section>
      <section className="section detail-grid">
        <div>
          <div className="section-kicker">The feeling</div>
          <h2>Space to grow<br /><em>into your life.</em></h2>
        </div>
        <div>
          <p className="large-copy">{project.description}</p>
          <div className="detail-stats">
            <div><strong>{project.area}</strong><span>of considered land</span></div>
            <div><strong>From ₹{(project.price_from / 100000).toFixed(1)}L</strong><span>starting investment</span></div>
          </div>
          {project.brochure_url && (
            <a href={project.brochure_url} target="_blank" rel="noreferrer" className="button" data-testid="detail-brochure">
              <FileText size={16} /> Download brochure <Download size={14} />
            </a>
          )}
        </div>
      </section>
      {project.master_plan_url && (
        <section className="section master-plan-section" data-testid="master-plan-section">
          <div className="section-heading">
            <div>
              <div className="section-kicker">The master plan</div>
              <h2>Every plot, <em>considered.</em></h2>
            </div>
          </div>
          <a href={project.master_plan_url} target="_blank" rel="noreferrer" className="master-plan-frame">
            <img src={project.master_plan_url} alt={`${project.name} master plan`} />
          </a>
        </section>
      )}
      <section className="section properties-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">Availability</div>
            <h2>Find your <em>place.</em></h2>
          </div>
          <Button to="/book-site-visit" testid="detail-book-visit">Book a visit</Button>
        </div>
        <div className="property-table">
          {(project.properties || []).map((p) => (
            <div className="property-row" key={p.id} data-testid={`property-row-${p.number}`}>
              <div>
                <strong>{p.number}</strong>
                <span>{p.size} · {p.facing} facing</span>
              </div>
              <strong>₹{(p.price / 100000).toFixed(1)}L</strong>
              <span className={`status status-${p.status}`}>{p.status}</span>
              <Link to="/contact" className="row-link">Enquire <ArrowRight size={15} /></Link>
            </div>
          ))}
          {!(project.properties || []).length && <div className="empty-state">Availability coming soon.</div>}
        </div>
      </section>
    </PublicLayout>
  );
}
