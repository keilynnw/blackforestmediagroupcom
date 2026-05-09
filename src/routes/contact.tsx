import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Black Forest Signature Marketing" },
      { name: "description", content: "Inquire about bespoke social media management with Black Forest Signature Marketing." },
      { property: "og:title", content: "Contact — Black Forest Signature" },
      { property: "og:description", content: "Inquire about bespoke social media management." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="pt-40 pb-32 px-6 md:px-16 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6 text-center">Inquire</p>
        <h1 className="font-display text-5xl md:text-7xl text-accent leading-tight text-center">
          Let's begin your <span className="font-script text-primary">story.</span>
        </h1>
        <p className="text-center text-muted-foreground mt-6 max-w-xl mx-auto">
          Tell us a little about your brand. We respond to every inquiry within two business days.
        </p>

        <form
          className="mt-16 space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const payload = {
              name: String(data.get("name") || ""),
              email: String(data.get("email") || ""),
              brand: String(data.get("brand") || ""),
              vision: String(data.get("vision") || ""),
            };
            setSubmitting(true);
            try {
              const res = await fetch("/api/public/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!res.ok) throw new Error("Failed");
              toast.success("Thank you — we'll be in touch within two business days.");
              form.reset();
            } catch {
              toast.error("Something went wrong. Please try again or email us directly.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {[
            { l: "Name", t: "text", n: "name" },
            { l: "Email", t: "email", n: "email" },
            { l: "Brand / Business", t: "text", n: "brand" },
          ].map((f) => (
            <div key={f.n}>
              <label className="block text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">{f.l}</label>
              <input required type={f.t} name={f.n} className="w-full bg-transparent border-b border-accent/40 py-3 focus:border-accent outline-none text-accent" />
            </div>
          ))}
          <div>
            <label className="block text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Tell us about your vision</label>
            <textarea required rows={5} name="vision" className="w-full bg-transparent border-b border-accent/40 py-3 focus:border-accent outline-none text-accent resize-none" />
          </div>
          <button disabled={submitting} className="w-full bg-accent text-accent-foreground text-xs tracking-[0.3em] uppercase py-5 hover:bg-accent/90 transition-colors disabled:opacity-50">
            {submitting ? "Sending…" : "Send Inquiry"}
          </button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
