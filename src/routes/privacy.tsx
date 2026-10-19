import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Black Forest Signature Marketing" },
      { name: "description", content: "How Black Forest Media Group, LLC collects, uses, and protects your personal information, including rights under Washington State law." },
      { property: "og:title", content: "Privacy Policy — Black Forest Signature" },
      { property: "og:description", content: "Our privacy practices and your rights under Washington State law." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const sections: { h: string; p: string[] }[] = [
  { h: "Who We Are", p: ["Black Forest Signature Marketing is operated by Black Forest Media Group, LLC, a Washington limited liability company (\"we,\" \"us,\" \"our\"). This policy explains how we collect, use, share, and protect personal information through this website, our client portal, and our services."] },
  { h: "Information We Collect", p: [
    "Information you provide: name, email address, phone number, business details, and messages submitted through our contact form; account details, files, messages, intake form responses, and content calendar data submitted through the client portal.",
    "Information collected automatically: basic technical data such as browser type, device information, IP address, and pages visited, used to operate and secure the site.",
    "We do not knowingly collect consumer health data as defined by the Washington My Health My Data Act (RCW 19.373), and we do not collect biometric identifiers for commercial purposes as described in RCW 19.375.",
  ] },
  { h: "How We Use Information", p: ["To respond to inquiries, provide and manage our marketing services, operate the client portal, send service-related emails (such as portal activity notices and password resets), maintain security, and comply with legal obligations."] },
  { h: "How We Share Information", p: [
    "We do not sell personal information. We share information only with service providers who help us operate (for example hosting, data storage, email delivery, and form tools such as Google Forms), under obligations to protect it, or when required by law.",
  ] },
  { h: "Data Security & Breach Notification", p: ["We use reasonable administrative, technical, and physical safeguards, including encrypted connections and access controls. In the event of a data breach affecting your personal information, we will notify affected individuals and, where required, the Washington State Attorney General, in accordance with RCW 19.255.010 — no later than 30 days after discovery."] },
  { h: "Data Retention", p: ["We keep personal information only as long as needed to provide services, meet our contractual and legal obligations, and resolve disputes. Clients may request deletion of portal data at any time after an engagement ends."] },
  { h: "Your Rights", p: ["You may request access to, correction of, or deletion of your personal information, and you may opt out of marketing emails at any time using the unsubscribe link in any email. To make a request, contact us at the email below. We will respond within 45 days and will not discriminate against you for exercising these rights."] },
  { h: "Email Communications", p: ["Commercial emails we send comply with the Washington Commercial Electronic Mail Act (RCW 19.190) and the federal CAN-SPAM Act — they will not contain false or misleading subject lines or sender information, and every marketing message includes a way to unsubscribe."] },
  { h: "Cookies", p: ["We use essential cookies and local storage needed to keep you signed in to the client portal. We do not use third-party advertising cookies on this site."] },
  { h: "Children's Privacy", p: ["Our services are intended for businesses and are not directed to children under 13. We do not knowingly collect personal information from children."] },
  { h: "Changes to This Policy", p: ["We may update this policy from time to time. Changes take effect when posted on this page with a new effective date."] },
  { h: "Contact Us", p: ["Black Forest Media Group, LLC — marketing@blackforestmediagroup.com"] },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="pt-40 pb-32 px-6 md:px-16 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-6">Legal</p>
        <h1 className="font-display text-5xl md:text-6xl text-accent">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Effective October 19, 2026</p>
        <div className="mt-16 space-y-12">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-2xl md:text-3xl text-accent mb-4">{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i} className="text-foreground/80 leading-relaxed mt-3">{t}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
