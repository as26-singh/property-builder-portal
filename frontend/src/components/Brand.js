const LOGO_URL = "https://customer-assets-lqy194kg.emergentagent.net/job_codelytics-1/artifacts/n4s35m8f_Nirnay%20Group.webp";

export default function Brand({ light = false }) {
  return (
    <span className={`nirnay-brand ${light ? "nirnay-brand-light" : ""}`}>
      <img src={LOGO_URL} alt="Nirnay Group logo" />
      <span>
        Nirnay<span className="brand-light"> Group</span>
      </span>
    </span>
  );
}
