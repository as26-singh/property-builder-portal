import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import Button from "../components/Button";
import FeaturedProjects from "../components/FeaturedProjects";

export default function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="hero">
          <div className="hero-image"></div>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="eyebrow light"><Sparkles size={14} /> Places that feel like yours</div>
            <h1>Make room for<br /><em>what matters.</em></h1>
            <p>Thoughtfully planned homes and plots for people who want a little more life around them.</p>
            <div className="hero-actions">
              <Button to="/projects" testid="hero-explore-projects">Explore projects</Button>
              <Link to="/book-site-visit" className="text-link light-link" data-testid="hero-book-visit">
                Book a private visit <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <div className="hero-note">
            <span>01</span>
            <span>Homes & land, considered differently</span>
          </div>
        </section>
        <section className="section intro-section">
          <div className="section-kicker">A better starting point</div>
          <div className="intro-grid">
            <h2>Not just a plot.<br /><em>A place to belong.</em></h2>
            <div>
              <p className="large-copy">
                We create considered spaces that give you more than an address — a setting for your next chapter,
                with nature, community and everyday ease built in.
              </p>
              <Link to="/about" className="text-link" data-testid="home-story-link">
                Discover our approach <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <FeaturedProjects />
        <section className="quote-band">
          <div className="quote-mark">“</div>
          <blockquote>There is a quiet confidence in a place designed to last.</blockquote>
          <p>— The Nirnay principle</p>
        </section>
        <section className="section visit-banner">
          <div>
            <div className="section-kicker">Come see for yourself</div>
            <h2>Your next<br /><em>view starts here.</em></h2>
          </div>
          <Button to="/book-site-visit" testid="home-visit-cta">Book a private visit</Button>
        </section>
      </main>
    </PublicLayout>
  );
}
