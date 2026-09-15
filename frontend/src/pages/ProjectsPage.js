import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api";
import PublicLayout from "../components/PublicLayout";
import PageIntro from "../components/PageIntro";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get("/public/projects").then((r) => setProjects(r.data));
  }, []);
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="Our places"
        title={<>Projects with <em>perspective.</em></>}
        copy="From green neighbourhoods to considered plots, explore places made for the way life actually unfolds."
      />
      <section className="section">
        <div className="project-grid">
          {projects.map((p) => (
            <Link
              to={`/projects/${p.slug}`}
              className="project-card featured"
              key={p.id}
              data-testid={`projects-card-${p.slug}`}
            >
              <img src={p.image} alt={p.name} />
              <div className="project-card-content">
                <span>{p.location} · {p.area}</span>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <ArrowRight className="card-arrow" size={20} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
