import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import PortalLayout from "../components/PortalLayout";
import { useSiteContent } from "@/content";

export default function Dashboard({ admin = false }) {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const { content } = useSiteContent();
    document.title = content.settings.application_name
  useEffect(() => {
    if (!user || (admin ? user.role !== "super_admin" : user.role !== "associate")) return;
    api.get(admin ? "/admin/dashboard" : "/associate/dashboard").then((r) => setData(r.data)).catch(() => {});
  }, [admin, user]);
  const cards = admin
    ? [
        ["projects", "Projects"],
        ["properties", "Properties"],
        ["available", "Available properties"],
        ["leads", "All leads"],
        ["associates", "Associates"],
        ["pending_leads", "Unassigned leads"],
      ]
    : [
        ["leads", "My leads"],
        ["follow_ups", "Pending follow-ups"],
        ["visits", "Site visits"],
        ["reservations", "Reservations"],
        ["bookings", "Bookings"],
      ];
  return (
    <PortalLayout title={admin ? "Admin" : "Associate"}>
      <>
        {admin ? "Good morning" : `Welcome, ${user?.name?.split(" ")[0]}`}
        <div className="dashboard-content">
          <div className="metric-grid">
            {cards.map(([key, label]) => (
              <div className="metric-card" key={key} data-testid={`metric-${key}`}>
                <span>{label}</span>
                <strong>{data[key] ?? "—"}</strong>
                <div className="metric-line"></div>
              </div>
            ))}
          </div>
          <div className="portal-callout">
            <div>
              <div className="section-kicker">{admin ? "Keep things moving" : "Your next best action"}</div>
              <h2>{admin ? "A clear view of every opportunity." : "Every conversation can become a place."}</h2>
              <p>
                {admin
                  ? "Assign new enquiries quickly and keep your sales team focused on the people who need them most."
                  : "Stay close to your leads, follow up thoughtfully and make every visit count."}
              </p>
            </div>
            <Sparkles size={48} />
          </div>
        </div>
      </>
    </PortalLayout>
  );
}
