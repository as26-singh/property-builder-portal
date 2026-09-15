import { Phone } from "lucide-react";

export default function PhoneBand({ phone, title, copy }) {
  if (!phone) return null;
  const tel = phone.replace(/[^+\d]/g, "");
  return (
    <section className="phone-band" data-testid="phone-band">
      <div>
        <div className="section-kicker light">Talk to a human</div>
        <h2>{title || "Talk to a Nirnay advisor"}</h2>
        <p>{copy || "Call for personal guidance, project walkthroughs or availability updates."}</p>
      </div>
      <a href={`tel:${tel}`} className="phone-cta" data-testid="phone-band-cta">
        <Phone size={20} />
        <span>{phone}</span>
      </a>
    </section>
  );
}
