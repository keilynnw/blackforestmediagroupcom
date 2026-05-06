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
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-8">The Studio</p>
        <h1 className="font-display text-5xl md:text-7xl text-accent leading-tight">
          Brand presences with a quiet <span className="font-script text-primary">staying power.</span>
        </h1>
        <div className="mt-16 grid md:grid-cols-2 gap-12 text-foreground/80 leading-relaxed">
          <p>
            Black Forest Signature Marketing is the creative side of Black Forest Media Group, LLC — a small studio built on the idea that a brand's presence should feel as considered as the work it stands for.
          </p>
          <p>
            We take on a short, intentional client list each season. Strategy, imagery, and the words that actually close the sale — handled like an extension of your own team. Calm, attentive, unmistakably yours.
          </p>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-12 border-t border-border pt-16">
          {[
            { k: "Tailored", v: "No templates. Built around your brand." },
            { k: "Considered", v: "Slower decisions. Sharper output." },
            { k: "Distinct", v: "Work that could only belong to you." },
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
