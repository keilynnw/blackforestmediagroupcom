import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Black Forest Signature Marketing" },
      { name: "description", content: "A boutique social media studio rooted in storytelling, intention, and signature design." },
      { property: "og:title", content: "About — Black Forest Signature" },
      { property: "og:description", content: "A boutique social media studio." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="pt-40 pb-32 px-6 md:px-16 max-w-5xl mx-auto">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-8">Our Story</p>
        <h1 className="font-display text-5xl md:text-7xl text-accent leading-tight">
          We craft brand presences that <span className="font-script text-primary">linger.</span>
        </h1>
        <div className="mt-16 grid md:grid-cols-2 gap-12 text-foreground/80 leading-relaxed">
          <p>
            Black Forest Signature Marketing is the creative arm of Black Forest Media Group, LLC — a boutique studio founded on the belief that every brand deserves a presence as considered as the work behind it.
          </p>
          <p>
            We partner with a small, intentional roster of clients each season. From strategy to imagery to the words that close the sale, we move as an extension of your team — quiet, attentive, signature.
          </p>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-12 border-t border-border pt-16">
          {[
            { k: "Bespoke", v: "Nothing templated. Everything tailored." },
            { k: "Intentional", v: "Slow strategy. Considered output." },
            { k: "Signature", v: "Distinct work that could only be yours." },
          ].map((v) => (
            <div key={v.k}>
              <p className="font-display text-3xl text-primary">{v.k}</p>
              <p className="text-sm text-muted-foreground mt-3">{v.v}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
