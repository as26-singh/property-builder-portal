import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
        </div>
      </section>
      <section className="section properties-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">Availability</div>
            <h2>Find your <em>place.</em></h2>
          </div>
          <Button to="/book-site-visit" testid="detail-book-visit">Book a visit</Button>
        </div>
        <div className="property-table">
          {project.properties.map((p) => (
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
        </div>
      </section>
    </PublicLayout>
  );
}
