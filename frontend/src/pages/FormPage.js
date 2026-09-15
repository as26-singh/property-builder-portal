import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "../api";
import PublicLayout from "../components/PublicLayout";
import Button from "../components/Button";

export default function FormPage({ visit = false }) {
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(visit ? "/public/site-visits" : "/public/inquiries", form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Please check your details and try again.");
    }
  };
  if (done) {
    return (
      <PublicLayout>
        <div className="success-state">
          <CheckCircle2 size={48} />
          <div className="section-kicker">Thank you</div>
          <h1>{visit ? "Your visit is on its way." : "We'll be in touch."}</h1>
          <p>Our team will contact you shortly with the next steps.</p>
          <Button to="/" testid="form-success-home">Back to home</Button>
        </div>
      </PublicLayout>
    );
  }
  return (
    <PublicLayout>
      <section className="form-page">
        <div className="form-copy">
          <div className="section-kicker">{visit ? "A little closer" : "Start a conversation"}</div>
          <h1>{visit ? <>See it<br /><em>in person.</em></> : <>Let's find<br /><em>your place.</em></>}</h1>
          <p>
            {visit
              ? "Tell us when you would like to visit. We'll make the experience personal, relaxed and entirely yours."
              : "Share a few details and our team will help you find the right project or property."}
          </p>
        </div>
        <form className="lead-form" onSubmit={submit}>
          <label>
            Your name
            <input required data-testid="inquiry-name-input" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Phone number
            <input required data-testid="inquiry-phone-input" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            Email address
            <input type="email" data-testid="inquiry-email-input" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          {visit && (
            <>
              <label>
                Preferred date
                <input required type="date" data-testid="visit-date-input" onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
              </label>
              <label>
                Preferred time
                <select data-testid="visit-time-select" onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </label>
            </>
          )}
          <label>
            How can we help?
            <textarea data-testid="inquiry-message-input" rows="4" onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          {error && <div className="form-error" data-testid="form-error">{error}</div>}
          <Button type="submit" testid="inquiry-submit-button">
            {visit ? "Request my visit" : "Send enquiry"}
          </Button>
        </form>
      </section>
    </PublicLayout>
  );
}
