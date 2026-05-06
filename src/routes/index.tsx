import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Black Forest Signature Marketing — Social Media Management" },
      { name: "description", content: "Bespoke social media management and brand storytelling for refined businesses. By Black Forest Media Group, LLC." },
      { property: "og:title", content: "Black Forest Signature Marketing" },
      { property: "og:description", content: "Bespoke social media management and brand storytelling." },
    ],
  }),
  component: Index,
});

const services = [
  { n: "01", t: "Social Strategy", d: "Custom monthly strategy crafted around your voice, audience, and goals." },
  { n: "02", t: "Content Creation", d: "Editorial photography, reels, and copy that feels unmistakably yours." },
  { n: "03", t: "Account Management", d: "Daily posting, engagement, and community care across every platform." },
  { n: "04", t: "Brand Storytelling", d: "Positioning and narrative that turns followers into loyal clients." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative min-h-[100svh] grid md:grid-cols-2">
        <div className="flex items-center px-6 md:px-16 pt-32 pb-20">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-8">
              Signature Social — Est. 2024
            </p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-accent">
              Marketing with a <span className="font-script text-primary block mt-2 text-6xl md:text-8xl">signature</span> touch.
            </h1>
            <p className="mt-8 text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
              We are a boutique social media studio crafting elevated, intentional content for brands that refuse to blend in.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                to="/contact"
                className="inline-flex items-center text-xs tracking-[0.3em] uppercase bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/90 transition-colors"
              >
                Begin Your Story
              </Link>
              <Link to="/services" className="text-xs tracking-[0.3em] uppercase text-accent border-b border-accent pb-1">
                View Services
              </Link>
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <img src={hero} alt="Editorial brand photography" className="absolute inset-0 w-full h-full object-cover" width={1600} height={1200} />
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-32 px-6 text-center border-y border-border">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">Our Philosophy</p>
        <p className="font-display text-3xl md:text-5xl max-w-4xl mx-auto leading-tight text-accent">
          "A brand presence should feel like a <span className="font-script text-primary">love letter</span> — considered, distinct, and impossible to scroll past."
        </p>
      </section>

      {/* SERVICES */}
      <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-20">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground">What We Do</p>
          </div>
          <div className="md:col-span-2">
            <h2 className="font-display text-4xl md:text-6xl text-accent leading-tight">
              The signature <span className="font-script text-primary">suite</span>.
            </h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {services.map((s) => (
            <div key={s.n} className="bg-background p-10 md:p-14">
              <p className="font-display text-primary text-2xl mb-6">— {s.n}</p>
              <h3 className="font-display text-3xl text-accent mb-4">{s.t}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-32 px-6 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">Now Booking</p>
        <h2 className="font-display text-4xl md:text-6xl text-accent max-w-3xl mx-auto leading-tight">
          Ready to be unforgettable <span className="font-script text-primary">online?</span>
        </h2>
        <Link
          to="/contact"
          className="mt-12 inline-flex items-center text-xs tracking-[0.3em] uppercase bg-accent text-accent-foreground px-10 py-5 hover:bg-accent/90 transition-colors"
        >
          Inquire Now
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
