import { useState } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { api } from "../api";
import Modal from "./Modal";
import Button from "./Button";

export default function EnquireRibbon() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/public/inquiries", form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Please check your details and try again.");
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setForm({});
      setError("");
    }, 250);
  };

  return (
    <>
      <button
        className="enquire-ribbon"
        onClick={() => setOpen(true)}
        data-testid="enquire-ribbon"
        aria-label="Open enquiry form"
      >
        <MessageSquare size={16} />
        <span>Enquire</span>
      </button>
      <Modal open={open} onClose={close} title={done ? "Thank you" : "Quick enquiry"} testid="enquire-modal">
        {done ? (
          <div className="modal-success">
            <CheckCircle2 size={40} />
            <p>Our team will be in touch shortly.</p>
            <Button onClick={close} testid="enquire-modal-close-success">Close</Button>
          </div>
        ) : (
          <form className="lead-form modal-form" onSubmit={submit}>
            <label>
              Your name
              <input required data-testid="enquire-name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Phone
              <input required data-testid="enquire-phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Email
              <input type="email" data-testid="enquire-email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Message
              <textarea rows="3" data-testid="enquire-message" value={form.message || ""} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            {error && <div className="form-error" data-testid="enquire-error">{error}</div>}
            <Button type="submit" testid="enquire-submit">Send enquiry</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
