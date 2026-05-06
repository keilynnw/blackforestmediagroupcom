import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import laptop from "@/assets/section-laptop.jpg";
import founder from "@/assets/founder.jpg";
import g1 from "@/assets/grid-1.jpg";
import g2 from "@/assets/grid-2.jpg";
import g3 from "@/assets/grid-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Black Forest Signature Marketing — Social Media Studio" },
      { name: "description", content: "A boutique social media management studio helping businesses show up confidently online through strategy, content, and brand storytelling." },
      { property: "og:title", content: "Black Forest Signature Marketing" },
      { property: "og:description", content: "A boutique social media management studio." },
    ],
  }),
  component: Index,
});

const marquee = ["Social Media Management", "Strategy-Led Approach", "Creative Direction", "Ad Management"];

const services = [
  { t: "Smart Marketing Strategy", d: "A clear, customized marketing plan built around how your business actually works. Messaging, positioning, audience clarity, and a roadmap built for growth." },
  { t: "Content & Social Media", d: "Strategic content that builds trust and showcases your expertise. Ongoing planning, copywriting, optimization, and performance tracking." },
  { t: "Ad Management", d: "Ads focused on results, not clicks. Right targeting, clear messaging, and continuous improvement paired with CRM and automations." },
  { t: "Full-Service Marketing", d: "Your external marketing team — social, content, SEO, website updates, ad strategy, and creative direction in one place." },
];

const pillars = [
  { n: "01", t: "Collaborative", d: "We see every project as a partnership. Strategy to execution, your brand's voice and goals stay at the center." },
  { n: "02", t: "Creative Solutions", d: "Tailored strategies and scroll-stopping visuals designed to capture attention and set your business apart." },
  { n: "03", t: "Clear Results", d: "Straightforward reporting and actionable insights, so you always know what's working and how you're growing." },
];

const testimonials = [
  "Black Forest has a gift for understanding not just marketing, but people. They took the time to truly understand my business and turned all my ideas into something that finally makes sense.",
  "Creative, patient, and fast. Every time I work with them, I feel like my business is in the hands of someone who gets both the big picture and the details that matter.",
  "What sets them apart is how much they actually care. They listen, ask the right questions, and bring strategy to life in a way that feels effortless.",
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader hideLogo />

      {/* LOGO BANNER */}
      <section className="relative w-full bg-background flex items-center justify-center px-2 sm:px-4 pt-2 sm:pt-3 pb-0 -mb-[16vw] sm:-mb-[12vw] overflow-hidden">
        <img
          src={logo}
          alt="Black Forest Signature Marketing"
          className="block mx-auto w-full max-w-[min(96vw,1200px)] h-auto object-contain"
        />
      </section>

      {/* HERO */}
      <section className="relative min-h-[67vh] flex items-center justify-center text-center overflow-hidden">
        <img src={hero} alt="Editorial workspace" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 px-6 max-w-5xl">
          <h1 className="font-display text-white text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight">
            Boutique <em className="font-display italic text-primary">Social Media Studio</em> Supporting Brands <em className="font-display italic text-primary">Everywhere</em>
          </h1>
          <p className="mt-8 text-white/90 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Helping businesses show up confidently online through strategy, social media, ads, branding, and content that converts.
          </p>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border bg-background overflow-hidden">
        <div className="flex gap-12 py-6 animate-marquee whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span key={i} className="font-display italic text-2xl md:text-4xl text-accent">
              {m} <span className="text-primary not-italic">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 1 — image + intro */}
      <section className="px-6 md:px-16 py-24 md:py-32 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={laptop} alt="Quiet workspace" className="w-full h-full object-cover" loading="lazy" width={1200} height={1200} />
        </div>
        <div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] text-accent">
            Building a strong, <em className="italic text-primary">strategic</em> online presence for ambitious businesses.
          </h2>
          <div className="mt-8 h-px w-16 bg-primary" />
          <p className="mt-8 text-foreground/80 leading-relaxed">
            Most businesses aren't struggling because they're bad at what they do — they're struggling because their marketing is unclear, inconsistent, or built without a real strategy.
          </p>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            We focus on creating clarity, building systems, and executing marketing that actually brings in customers. From social media and ads to CRM systems and automation, everything is designed to help your business look credible, communicate clearly, and grow with intention.
          </p>
          <Link
            to="/services"
            className="mt-10 inline-flex items-center text-xs tracking-[0.3em] uppercase border border-accent text-accent px-8 py-4 hover:bg-accent hover:text-background transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* SERVICES LIST */}
      <section className="bg-secondary px-6 md:px-16 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground text-center mb-6">What We Do</p>
          <h2 className="font-display text-4xl md:text-6xl text-accent text-center max-w-3xl mx-auto leading-tight">
            A <em className="italic text-primary">signature</em> approach to every service.
          </h2>
          <div className="mt-20 grid md:grid-cols-2 gap-px bg-border">
            {services.map((s, i) => (
              <div key={s.t} className="bg-secondary p-10 md:p-14">
                <p className="font-display italic text-primary text-2xl mb-6">— 0{i + 1}</p>
                <h3 className="font-display text-3xl md:text-4xl text-accent mb-5">{s.t}</h3>
                <p className="text-foreground/75 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              to="/services"
              className="inline-flex items-center text-xs tracking-[0.3em] uppercase border border-accent text-accent px-8 py-4 hover:bg-accent hover:text-background transition-colors"
            >
              All Services
            </Link>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="px-6 md:px-16 py-24 md:py-32 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="order-2 md:order-1">
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">Meet The Studio</p>
          <h2 className="font-display text-4xl md:text-6xl text-accent leading-[1.05]">
            <em className="italic text-primary">Hi there,</em> we're Black Forest Signature.
          </h2>
          <div className="mt-8 h-px w-16 bg-primary" />
          <p className="mt-8 text-foreground/80 leading-relaxed">
            Black Forest Signature Marketing is the creative arm of Black Forest Media Group, LLC — a boutique studio built on story and strategy. After years of helping brands launch and scale, we've seen how many talented businesses still struggle to make sense of marketing.
          </p>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            Today, we help brands bridge that gap — building clarity, credibility, and confidence through strategy-led marketing that actually works.
          </p>
          <Link
            to="/about"
            className="mt-10 inline-flex items-center text-xs tracking-[0.3em] uppercase border border-accent text-accent px-8 py-4 hover:bg-accent hover:text-background transition-colors"
          >
            About The Studio
          </Link>
        </div>
        <div className="order-1 md:order-2 relative aspect-[4/5] overflow-hidden">
          <img src={founder} alt="Founder portrait" className="w-full h-full object-cover" loading="lazy" width={1100} height={1400} />
        </div>
      </section>

      {/* PILLARS */}
      <section className="bg-accent text-background px-6 md:px-16 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 md:gap-16">
          {pillars.map((p) => (
            <div key={p.n}>
              <p className="font-display italic text-primary text-3xl mb-6">{p.n}</p>
              <p className="text-background/80 leading-relaxed mb-8">{p.d}</p>
              <h3 className="font-display text-3xl md:text-4xl text-background">{p.t}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* IMAGE GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
        {[g1, g2, g3].map((src, i) => (
          <div key={i} className="aspect-[3/4] overflow-hidden bg-background">
            <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" width={900} height={1200} />
          </div>
        ))}
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 md:px-16 py-24 md:py-32 max-w-5xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-12">Kind Words</p>
        <div className="grid md:grid-cols-3 gap-12">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="font-display italic text-xl md:text-2xl text-accent leading-snug">
              "{t}"
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-[80vh] flex items-center justify-center text-center overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1280} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-6 max-w-3xl">
          <h2 className="font-display text-white text-5xl md:text-7xl leading-tight">
            Come say <em className="italic text-primary">hey!</em>
          </h2>
          <p className="mt-6 text-white/90 text-lg max-w-xl mx-auto">
            Have a project, vision, or goal for your business? Let's talk about how we can bring your ideas to life.
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center text-xs tracking-[0.3em] uppercase bg-background text-accent px-10 py-5 hover:bg-primary hover:text-background transition-colors"
          >
            Start The Conversation
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
