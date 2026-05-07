import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Black Forest Signature Marketing" },
      { name: "description", content: "Bespoke social media management, content creation, and brand storytelling packages." },
      { property: "og:title", content: "Services — Black Forest Signature" },
      { property: "og:description", content: "Bespoke social media management packages." },
    ],
  }),
  component: Services,
});

const packages = [
  {
    name: "Trail",
    tag: "Foundation",
    price: "$749/mo",
    blurb: "A refined, reliable social presence that keeps your brand visible, polished, and effortlessly on-brand.",
    items: ["12 curated posts monthly", "8 reels or stories", "Caption + hashtag strategy", "Monthly analytics report"],
  },
  {
    name: "Ridge",
    tag: "Community Focused",
    price: "$1,497/mo",
    blurb: "Elevated social management with hands-on community care that turns followers into a warm, engaged audience.",
    items: ["16 curated posts monthly", "12 reels or stories", "Daily community management", "Caption + hashtag strategy", "Monthly analytics report"],
  },
  {
    name: "Summit",
    tag: "Signature — Most Loved",
    price: "$2,997/mo",
    blurb: "Our signature, fully managed social media partnership — strategy, content, and performance handled end-to-end for brands ready to lead.",
    items: ["20 curated posts monthly", "16 reels with editing", "Daily community management", "Quarterly content shoot", "Bi-weekly strategy calls"],
  },
];

function Services() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="pt-40 pb-20 px-6 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">Services</p>
        <h1 className="font-display text-5xl md:text-7xl text-accent max-w-4xl mx-auto leading-tight">
          Curated <span className="font-script text-primary">offerings</span> for every chapter.
        </h1>
      </section>

      <section className="px-6 md:px-16 max-w-7xl mx-auto pb-32">
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {packages.map((p) => (
            <div key={p.name} className="bg-background p-10 flex flex-col">
              <p className="text-xs tracking-[0.3em] uppercase text-primary mb-6">{p.tag}</p>
              <h3 className="font-display text-3xl text-accent">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-8">{p.price}</p>
              <ul className="space-y-3 flex-1">
                {p.items.map((i) => (
                  <li key={i} className="text-sm text-foreground/80 border-b border-border pb-3">— {i}</li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-10 inline-flex justify-center items-center text-xs tracking-[0.3em] uppercase border border-accent text-accent px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Inquire
              </Link>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
