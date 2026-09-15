import PublicLayout from "../components/PublicLayout";
import PageIntro from "../components/PageIntro";

export default function GalleryPage() {
  return (
    <PublicLayout>
      <PageIntro
        eyebrow="A sense of place"
        title={<>Life, <em>beautifully framed.</em></>}
        copy="A glimpse into the details, textures and open skies that shape a Nirnay place."
      />
      <section className="section gallery-grid">
        <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85" alt="Warm modern living room" />
        <img src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=800&q=85" alt="Open plan interior" />
        <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=85" alt="Natural light interior" />
        <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85" alt="Elegant home detail" />
      </section>
    </PublicLayout>
  );
}
