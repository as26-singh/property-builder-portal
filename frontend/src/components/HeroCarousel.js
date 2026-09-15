import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function HeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (!count) {
    return <section className="hero"><div className="hero-image" /></section>;
  }

  const slide = slides[index];
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section className="hero hero-carousel" data-testid="hero-carousel">
      {slides.map((s, i) => (
        <div
          key={s.id || i}
          className={`hero-slide ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${s.image})` }}
          aria-hidden={i !== index}
        />
      ))}
      <div className="hero-overlay" />
      <div className="hero-content">
        {slide.kicker && (
          <div className="eyebrow light">
            <Sparkles size={14} /> {slide.kicker}
          </div>
        )}
        <h1 dangerouslySetInnerHTML={{ __html: slide.title.replace(/\n/g, "<br/>") }} />
        {slide.subtitle && <p>{slide.subtitle}</p>}
        <div className="hero-actions">
          {slide.cta_label && slide.cta_link && (
            <Link to={slide.cta_link} className="button" data-testid="hero-cta">
              {slide.cta_label} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
      {count > 1 && (
        <>
          <button className="hero-arrow left" onClick={prev} aria-label="Previous slide" data-testid="hero-prev">
            <ChevronLeft size={22} />
          </button>
          <button className="hero-arrow right" onClick={next} aria-label="Next slide" data-testid="hero-next">
            <ChevronRight size={22} />
          </button>
          <div className="hero-dots" role="tablist">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === index ? "active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                data-testid={`hero-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
