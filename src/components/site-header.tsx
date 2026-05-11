import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function SiteHeader({ hideLogo = false }: { hideLogo?: boolean }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 pt-6 grid grid-cols-3 items-center gap-6">
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.25em] uppercase text-foreground/80 justify-self-start">
          <Link to="/" activeProps={{ className: "text-accent" }}>Home</Link>
          <Link to="/services" activeProps={{ className: "text-accent" }}>Services</Link>
        </nav>
        <Link to="/" className="flex items-center justify-self-center col-start-2">
          {!hideLogo && (
            <img
              src={logo}
              alt="Black Forest Signature Marketing"
              className="h-16 md:h-20 w-auto object-contain"
            />
          )}
        </Link>
        <div className="hidden md:flex items-center gap-10 text-xs tracking-[0.25em] uppercase text-foreground/80 justify-self-end">
          <Link to="/about" activeProps={{ className: "text-accent" }}>About</Link>
          <Link to="/contact" activeProps={{ className: "text-accent" }}>Contact</Link>
          <Link to="/portal" className="text-foreground/60 hover:text-accent">Client Login</Link>
          <Link
            to="/contact"
            className="inline-flex items-center border border-accent/40 px-5 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Book a Call
          </Link>
        </div>
      </div>
    </header>
  );
}
