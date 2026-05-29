import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

export function SiteHeader({ hideLogo = false }: { hideLogo?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="bg-accent text-accent-foreground text-[10px] md:text-xs tracking-[0.25em] uppercase">
        <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-end">
          <a
            href="https://blackforest-photography.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Visit Black Forest Photography →
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 pt-6 grid grid-cols-3 items-center gap-6">
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.25em] uppercase text-foreground/80 justify-self-start">
          <Link to="/" activeProps={{ className: "text-accent" }}>Home</Link>
          <Link to="/services" activeProps={{ className: "text-accent" }}>Services</Link>
          <a
            href="https://www.blackforest-photography.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            Photography
          </a>
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

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden justify-self-end col-start-3 text-foreground/80 hover:text-accent"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden mx-4 mt-4 border border-border/40 bg-background/95 backdrop-blur-md">
          <nav className="flex flex-col text-xs tracking-[0.25em] uppercase text-foreground/80">
            <Link onClick={() => setOpen(false)} to="/" className="px-6 py-4 border-b border-border/30 hover:text-accent">Home</Link>
            <Link onClick={() => setOpen(false)} to="/services" className="px-6 py-4 border-b border-border/30 hover:text-accent">Services</Link>
            <Link onClick={() => setOpen(false)} to="/about" className="px-6 py-4 border-b border-border/30 hover:text-accent">About</Link>
            <Link onClick={() => setOpen(false)} to="/contact" className="px-6 py-4 border-b border-border/30 hover:text-accent">Contact</Link>
            <Link onClick={() => setOpen(false)} to="/portal" className="px-6 py-4 border-b border-border/30 text-accent">Client Login</Link>
            <Link
              onClick={() => setOpen(false)}
              to="/contact"
              className="px-6 py-4 text-accent-foreground bg-accent text-center"
            >
              Book a Call
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
