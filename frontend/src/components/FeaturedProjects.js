import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api";

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get("/public/projects").then((r) => setProjects(r.data));
  }, []);
  return (
    <section className="section projects-section">
      <div className="section-heading">
        <div>
          <div className="section-kicker">Our places</div>
          <h2>Made for <em>living well.</em></h2>
        </div>
        <Link to="/projects" className="text-link" data-testid="view-all-projects">
          View all projects <ArrowRight size={17} />
        </Link>
      </div>
      <div className="project-grid">
        {projects.map((p, i) => (
          <Link
            to={`/projects/${p.slug}`}
            className={`project-card ${i === 0 ? "featured" : ""}`}
            key={p.id}
            data-testid={`project-card-${p.slug}`}
          >
            <img src={p.image} alt={p.name} />
            <div className="project-card-content">
              <span>{p.location}</span>
              <h3>{p.name}</h3>
              <p>{p.tagline}</p>
              <ArrowRight className="card-arrow" size={20} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
