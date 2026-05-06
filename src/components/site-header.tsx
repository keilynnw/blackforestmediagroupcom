import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Black Forest Signature Marketing" className="h-12 md:h-14 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.25em] uppercase text-foreground/80">
          <Link to="/" activeProps={{ className: "text-accent" }}>Home</Link>
          <Link to="/services" activeProps={{ className: "text-accent" }}>Services</Link>
          <Link to="/about" activeProps={{ className: "text-accent" }}>About</Link>
          <Link to="/contact" activeProps={{ className: "text-accent" }}>Contact</Link>
        </nav>
        <Link
          to="/contact"
          className="hidden md:inline-flex items-center text-xs tracking-[0.25em] uppercase border border-accent/40 px-5 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Book a Call
        </Link>
      </div>
    </header>
  );
}
