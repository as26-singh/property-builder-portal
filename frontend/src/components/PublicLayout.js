import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
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
          <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="nav-phone" data-testid="nav-phone">
            <Phone size={14} /> {settings.phone}
          </a>
        )}
        <Link to="/book-site-visit" className="nav-cta" data-testid="nav-site-visit">
          Book a visit <ArrowRight size={15} />
        </Link>
      </nav>
      <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} data-testid="mobile-menu-button">
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

export default function PublicLayout({ children }) {
  const { content } = useSiteContent();
  const settings = content?.settings || {};
  return (
    <>
      <PublicHeader />
      {children}
      <EnquireRibbon />
      <footer className="site-footer">
        <div>
          <Link to="/" className="brand"><Brand /></Link>
          <p>{settings.footer_copy || "Places with room to become your own."}</p>
          {settings.address && <p className="footer-address">{settings.address}</p>}
        </div>
        <div className="footer-links">
          <Link to="/projects">Projects</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/associate/login">Associate login</Link>
          <Link to="/admin/login">Admin login</Link>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Nirnay Group</div>
      </footer>
    </>
  );
}
