import { Quote } from "lucide-react";

export default function TestimonialsBand({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="section testimonials-band" data-testid="testimonials-band">
      <div className="section-kicker">In their words</div>
      <h2>Trusted by <em>the people we build for.</em></h2>
      <div className="testimonial-grid">
        {items.map((t) => (
          <figure className="testimonial-card" key={t.id} data-testid={`testimonial-${t.id}`}>
            <Quote size={22} className="testimonial-mark" />
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <div className="testimonial-avatar">{t.name?.charAt(0)}</div>
              <div>
                <strong>{t.name}</strong>
                {t.role && <span>{t.role}</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
