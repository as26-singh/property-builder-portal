import * as Icons from "lucide-react";
import { MapPin } from "lucide-react";

function DynamicIcon({ name, size = 22 }) {
  const Icon = Icons[name] || MapPin;
  return <Icon size={size} />;
}

export default function PropertyTypesBand({ types = [] }) {
  if (!types.length) return null;
  return (
    <section className="section types-band" data-testid="property-types-band">
      <div className="section-kicker">What we build</div>
      <h2>A place for <em>every kind of life.</em></h2>
      <div className="types-grid">
        {types.map((t) => (
          <div className="type-card" key={t.id} data-testid={`property-type-${t.id}`}>
            <div className="type-icon"><DynamicIcon name={t.icon} /></div>
            <strong>{t.name}</strong>
            {t.description && <span>{t.description}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
