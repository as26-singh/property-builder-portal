export default function PageIntro({ eyebrow, title, copy }) {
  return (
    <section className="page-intro">
      <div className="section-kicker">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{copy}</p>
    </section>
  );
}
