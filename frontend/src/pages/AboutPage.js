import PublicLayout from "../components/PublicLayout";
import PageIntro from "../components/PageIntro";

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="page-hero hero-about">
  <div className="hero-inner">
    <span className="eyebrow light">Our Foundation</span>
    <h1>Our Heritage & <em>Vision</em></h1>
    <p>Building trusted spaces with transparency, architectural precision, and enduring community value.</p>
  </div>
</section>
      <PageIntro
        eyebrow="Our story"
        title={<>Built around<br /><em>the good life.</em></>}
        copy="Nirnay Group began with a simple belief: the places we build should leave people feeling more grounded, more connected and more at home."
      />
      <section className="section about-band">
        <div className="about-image"></div>
        <div>
          <div className="section-kicker">The Nirnay difference</div>
          <h2>Thoughtful by<br /><em>nature.</em></h2>
          <p className="large-copy">
            We look closely at how people live, then build with patience — choosing better materials, protecting
            open space and making every detail feel considered.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
