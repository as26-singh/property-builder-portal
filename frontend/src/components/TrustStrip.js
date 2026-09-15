import * as Icons from "lucide-react";
import { MapPin } from "lucide-react";

function DynamicIcon({ name, size = 28 }) {
  const Icon = Icons[name] || MapPin;
  return <Icon size={size} />;
}

export default function TrustStrip({ pillars = [] }) {
  if (!pillars.length) return null;
  return (
    <section className="section trust-strip" data-testid="trust-strip">
      <div className="section-kicker">Why Nirnay</div>
      <h2>Made to <em>hold value.</em></h2>
      <div className="trust-grid">
        {pillars.map((p) => (
          <div className="trust-card" key={p.id} data-testid={`trust-pillar-${p.id}`}>
            <div className="trust-icon"><DynamicIcon name={p.icon} /></div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
