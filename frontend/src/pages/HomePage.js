import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PublicLayout from "../components/PublicLayout";
import Button from "../components/Button";
import FeaturedProjects from "../components/FeaturedProjects";
import HeroCarousel from "../components/HeroCarousel";
import TrustStrip from "../components/TrustStrip";
import TestimonialsBand from "../components/TestimonialsBand";
import PhoneBand from "../components/PhoneBand";
import PropertyTypesBand from "../components/PropertyTypesBand";
import { useSiteContent } from "../content";

export default function HomePage() {
  const { content } = useSiteContent();
  const settings = content?.settings || {};
  const slides = content?.heroSlides || [];
  const trust = content?.trustPillars || [];
  const testimonials = content?.testimonials || [];
  const types = content?.propertyTypes || [];

  return (
    <PublicLayout>
      <main>
        <HeroCarousel slides={slides} />

        <section className="section intro-section">
          <div className="section-kicker">A better starting point</div>
          <div className="intro-grid">
            <h2 dangerouslySetInnerHTML={{ __html: (settings.intro_title || "Not just a plot. A place to belong.").replace(". ", ".<br/><em>").replace(/([^.]+)$/, "$1</em>") }} />
            <div>
              <p className="large-copy">{settings.intro_copy}</p>
              <Link to="/about" className="text-link" data-testid="home-story-link">
                Discover our approach <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <TrustStrip pillars={trust} />
        <FeaturedProjects />
        <PropertyTypesBand types={types} />
        <TestimonialsBand items={testimonials} />
        <PhoneBand phone={settings.phone} title={settings.phone_band_title} copy={settings.phone_band_copy} />

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
