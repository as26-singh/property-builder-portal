import { useEffect, useState } from "react";
import { api } from "../api";
import PublicLayout from "../components/PublicLayout";
import PageIntro from "../components/PageIntro";
import { toAbsoluteUrl } from "../components/UploadField";

const FALLBACKS = [
  { id: "f1", url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85" },
  { id: "f2", url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=800&q=85" },
  { id: "f3", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85" },
  { id: "f4", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85" },
];

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/public/gallery").then((r) => setItems(r.data));
  }, []);
  const list = items.length ? items : FALLBACKS;
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="A sense of place"
        title={<>Life, <em>beautifully framed.</em></>}
        copy="A glimpse into the details, textures and open skies that shape a Nirnay place."
      />
      <section className="section gallery-grid" data-testid="public-gallery-grid">
        {list.map((g) => (
          <img key={g.id} src={toAbsoluteUrl(g.url)} alt={g.original_filename || "Gallery"} data-testid={`gallery-image-${g.id}`} />
        ))}
      </section>
    </PublicLayout>
  );
}
