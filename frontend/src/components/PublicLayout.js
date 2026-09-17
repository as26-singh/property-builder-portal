import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { 
  ArrowRight, 
  Menu, 
  Phone, 
  X, 
  MapPin, 
  Mail, 
  ChevronRight, 
  ArrowUp 
} from "lucide-react";
import Brand from "./Brand";
import EnquireRibbon from "./EnquireRibbon";
import { useSiteContent } from "../content";

function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { content } = useSiteContent();
  const settings = content?.settings || {};

  return (
    <header className="site-header">
      <Link to="/" className="brand" data-testid="brand-home">
        <Brand light tagline={settings.tagline_hi} />
      </Link>
      <nav className={open ? "public-nav open" : "public-nav"}>
        <NavLink to="/projects" data-testid="nav-projects">Projects</NavLink>
        <NavLink to="/properties" data-testid="nav-properties">Properties</NavLink>
        <NavLink to="/gallery" data-testid="nav-gallery">Gallery</NavLink>
        <NavLink to="/about" data-testid="nav-about">Our story</NavLink>
        <NavLink to="/contact" data-testid="nav-contact">Contact</NavLink>
        {settings.phone && (
          <a
            href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
            className="nav-phone"
            data-testid="nav-phone"
          >
            <Phone size={14} /> {settings.phone}
          </a>
        )}
        <Link to="/book-site-visit" className="nav-cta" data-testid="nav-site-visit">
          Book a visit <ArrowRight size={15} />
        </Link>
      </nav>
      <button
        className="icon-button mobile-menu"
        onClick={() => setOpen(!open)}
        data-testid="mobile-menu-button"
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

export default function PublicLayout({ children }) {
  const { content } = useSiteContent();
  const settings = content?.settings || {};
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (settings.application_name) {
      document.title = settings.application_name;
    }

    const handleScroll = () => {
      // Triggers when within 140px of bottom
      const reachedBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 140;
      setIsAtBottom(reachedBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [settings.application_name]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PublicHeader />
      {children}

      {/* Replaces Enquire ribbon with Scroll-to-Top when reaching the bottom */}
      {isAtBottom ? (
        <button
          className="bottom-scroll-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      ) : (
        <EnquireRibbon />
      )}

      <footer className="luxury-footer">
        <div className="footer-columns-container">
          {/* Column 1: Brand & Contact Info */}
          <div className="footer-pane brand-pane">
            <Link to="/" className="brand">
              <Brand light />
            </Link>
            <p className="footer-tagline">
              {settings.footer_copy || settings.footercopy || "Places with room to become your own."}
            </p>

            <div className="footer-meta-list">
              {settings.address && (
                <div className="meta-entry">
                  <span className="meta-icon">
                    <MapPin size={15} />
                  </span>
                  <span>{settings.address}</span>
                </div>
              )}

              {settings.email && (
                <a href={`mailto:${settings.email}`} className="meta-entry">
                  <span className="meta-icon">
                    <Mail size={15} />
                  </span>
                  <span>{settings.email}</span>
                </a>
              )}

              {settings.phone && (
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="meta-entry"
                >
                  <span className="meta-icon">
                    <Phone size={15} />
                  </span>
                  <span>{settings.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: About Us */}
          <div className="footer-pane">
            <h4 className="pane-title">About Us</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/about">
                  <ChevronRight size={13} className="bullet-arrow" />
                  About Company
                </Link>
              </li>
              <li>
                <Link to="/legal">
                  <ChevronRight size={13} className="bullet-arrow" />
                  Legal Documents
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="footer-pane">
            <h4 className="pane-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/legal">
                  <ChevronRight size={13} className="bullet-arrow" />
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/legal">
                  <ChevronRight size={13} className="bullet-arrow" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  <ChevronRight size={13} className="bullet-arrow" />
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/associate/login">
                  <ChevronRight size={13} className="bullet-arrow" />
                  Associate Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Office Timetable */}
          <div className="footer-pane">
            <h4 className="pane-title">Office Time Table</h4>
            <div className="schedule-sheet">
              <div className="schedule-line">
                <span>Monday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
              <div className="schedule-line holiday">
                <span>Tuesday</span>
                <span>Off (Holiday)</span>
              </div>
              <div className="schedule-line">
                <span>Wednesday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
              <div className="schedule-line">
                <span>Thursday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
              <div className="schedule-line">
                <span>Friday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
              <div className="schedule-line">
                <span>Saturday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
              <div className="schedule-line">
                <span>Sunday</span>
                <span>{settings.office_timing || "10:00 am To 6:00 pm"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-line">
          <div className="legal-links">
            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div className="brand-legal">
  © {new Date().getFullYear()}{" "}
  <Link to="/" className="accent-gold brand-legal-link">
    {settings.application_name}
  </Link>
  . All Rights Reserved.
</div>
        </div>
      </footer>
    </>
  );
}