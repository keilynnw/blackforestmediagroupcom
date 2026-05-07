import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-primary">Black Forest</p>
          <p className="font-script text-xl -mt-1">Signature</p>
          <p className="text-xs tracking-[0.3em] uppercase mt-2 text-accent-foreground/60">Marketing</p>
          <p className="mt-6 text-sm text-accent-foreground/70 max-w-xs">
            marketing@blackforestmediagroup.com
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Contact</p>
          <p className="text-sm text-accent-foreground/70">marketing@blackforestmediagroup.com</p>
          <p className="text-sm text-accent-foreground/70 mt-1">By appointment only</p>
        </div>
      </div>
      <div className="border-t border-accent-foreground/10 py-6 text-center text-xs tracking-[0.2em] uppercase text-accent-foreground/40">
        © {new Date().getFullYear()} Black Forest Media Group, LLC
      </div>
    </footer>
  );
}
