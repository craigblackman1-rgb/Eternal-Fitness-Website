"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const tocItems = [
  { id: "who-we-are", label: "Who we are" },
  { id: "services-provided", label: "Services provided" },
  { id: "booking-and-availability", label: "Booking and availability" },
  { id: "health-safety", label: "Health, safety, and your responsibility" },
  { id: "payments", label: "Payments" },
  { id: "cancellations", label: "Cancellations, rescheduling, and missed sessions" },
  { id: "packages", label: "Packages, blocks, and expiry" },
  { id: "results", label: "Results and expectations" },
  { id: "studio-rules", label: "Studio rules and conduct" },
  { id: "liability", label: "Liability and assumption of risk" },
  { id: "website-use", label: "Website use" },
];

export default function TermsPageClient() {
  const [activeId, setActiveId] = useState("who-we-are");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );
    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <img src="/images/hero-gym.jpg" alt="Terms and Conditions — Eternal Fitness Worthing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/70" />
        <div className="relative z-10 text-center max-w-2xl px-6">
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4">Terms &amp; Conditions</h1>
          <p className="text-white/70 font-body text-lg mb-8">
            These Terms and Conditions are governed by the laws of England and Wales and apply to all personal training services provided by Eternal Fitness.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/contact" className="inline-flex items-center gap-2 bg-teal text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
              Book a Free Consultation
            </a>
            <a href="#who-we-are" className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
              Read the Terms
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[260px_1fr] gap-12 items-start">
          {/* Sidebar TOC */}
          <aside className="md:sticky md:top-24">
            <h3 className="text-foreground text-lg mb-4">Table of Contents</h3>
            <nav className="flex flex-col gap-1">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                    activeId === item.id
                       ? "bg-rose text-white font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="prose-sm max-w-none space-y-12">
            <div id="who-we-are">
              <h2 className="text-2xl text-foreground mb-3">Who we are</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Eternal Fitness is a private personal training business operated by Esther Fair, based in Worthing, West Sussex. We provide private, one-to-one personal training and related coaching services. Our focus is long-term wellbeing, strength, mobility, confidence in movement, and sustainable progress — for people with a wide range of health conditions, abilities, and backgrounds.
              </p>
            </div>

            <div id="services-provided">
              <h2 className="text-2xl text-foreground mb-3">Services provided</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">Our services may include, depending on what you book:</p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-4">
                <li>One-to-one personal training sessions</li>
                <li>Assessments and goal setting</li>
                <li>Programme design and progress reviews</li>
                <li>Lifestyle and habit coaching (where agreed)</li>
                <li>Exercise support for wellbeing, mobility, strength, and rehabilitation</li>
              </ol>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">Important:</strong> We do not provide medical advice, diagnosis, or treatment. If you have a medical condition, injury, or concern, please speak to a qualified healthcare professional before starting. We will always work within our scope of practice and alongside your healthcare team where appropriate.
              </p>
            </div>

            <div id="booking-and-availability">
              <h2 className="text-2xl text-foreground mb-3">Booking and availability</h2>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-3">
                <li>Sessions must be booked in advance and confirmed by Esther.</li>
                <li>Booking confirmations are provided by email or message.</li>
                <li>Availability is discussed and agreed at the point of consultation.</li>
              </ol>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We may occasionally need to adjust schedules due to unforeseen circumstances and will always aim to provide as much notice as possible.
              </p>
            </div>

            <div id="health-safety">
              <h2 className="text-2xl text-foreground mb-3">Health, safety, and your responsibility</h2>
              <p className="text-muted-foreground text-sm mb-3">To keep training safe and appropriate for you:</p>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-3">
                <li>You agree to provide accurate and up-to-date information about your health, injuries, symptoms, medications, and any changes to your condition.</li>
                <li>You agree to follow Esther&apos;s guidance during sessions and use equipment responsibly.</li>
                <li>If anything feels painful, unsafe, or unusual, you must stop and tell Esther immediately.</li>
                <li>You understand that Esther may ask you to complete a health questionnaire (PAR-Q) before your first session.</li>
              </ol>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If Esther believes training is not currently safe for you, she may pause or decline to continue services until appropriate medical clearance is provided. This is done with your wellbeing in mind.
              </p>
            </div>

            <div id="payments">
              <h2 className="text-2xl text-foreground mb-3">Payments</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Payment terms — including whether sessions are billed individually, in blocks, or on an ongoing basis — are confirmed at booking or following your initial consultation. Prices are quoted in GBP (&pound;). Payments must be made by the agreed due date. Late payment may result in pausing future bookings until the balance is cleared.
              </p>
            </div>

            <div id="cancellations">
              <h2 className="text-2xl text-foreground mb-3">Cancellations, rescheduling, and missed sessions</h2>
              <p className="text-muted-foreground text-sm mb-3">We understand plans change and aim to be fair and consistent in how we handle this.</p>
              <h4 className="text-foreground text-sm mb-2">Client cancellations and rescheduling</h4>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-4">
                <li>If you cancel or reschedule with at least 24 hours&apos; notice, your session can be moved to a new time subject to availability.</li>
                <li>If you cancel or reschedule with less than 24 hours&apos; notice, the session may be charged in full.</li>
              </ol>
              <h4 className="text-foreground text-sm mb-2">No-shows</h4>
              <ol start={3} className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-4">
                <li>If you do not attend your session without contacting us, it will be treated as a no-show and charged in full.</li>
              </ol>
              <h4 className="text-foreground text-sm mb-2">Late arrival</h4>
              <ol start={4} className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5 mb-4">
                <li>If you arrive late, your session may still end at the scheduled time. The full session fee applies.</li>
              </ol>
              <h4 className="text-foreground text-sm mb-2">Cancellations by Eternal Fitness</h4>
              <ol start={5} className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5">
                <li>If Esther needs to cancel due to illness, emergency, or unavoidable circumstances, you can choose to reschedule or receive a full refund for that session.</li>
              </ol>
            </div>

            <div id="packages">
              <h2 className="text-2xl text-foreground mb-3">Packages, blocks, and expiry</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If you purchase a block or package of sessions: packages are personal to you and cannot be transferred to another person unless agreed in writing. Any expiry period will be communicated at the point of purchase. Refunds on partially used packages are handled on a case-by-case basis and may be subject to an administration fee, except where consumer law requires otherwise.
              </p>
            </div>

            <div id="results">
              <h2 className="text-2xl text-foreground mb-3">Results and expectations</h2>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5">
                <li>Esther provides professional coaching, structure, and support. However:</li>
                <li>Results vary from person to person based on consistency, health history, lifestyle, and many other factors.</li>
                <li>We cannot guarantee specific outcomes.</li>
                <li>Our focus is sustainable, long-term progress — not quick fixes or short-term transformations.</li>
              </ol>
            </div>

            <div id="studio-rules">
              <h2 className="text-2xl text-foreground mb-3">Studio rules and conduct</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                To maintain a calm and safe environment for all clients: please be respectful of Esther, the studio space, and any other clients you may encounter. Follow safety guidance and studio instructions at all times. Use clean indoor footwear if requested. Abusive, threatening, or inappropriate behaviour will result in the immediate end of a session, and future bookings may be refused at Esther&apos;s discretion.
              </p>
            </div>

            <div id="liability">
              <h2 className="text-2xl text-foreground mb-3">Liability and assumption of risk</h2>
              <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1.5">
                <li>Exercise involves inherent risk. By choosing to train, you acknowledge that physical activity may carry a risk of injury.</li>
                <li>To the fullest extent permitted by law, Eternal Fitness is not liable for loss, damage, or injury resulting from: inaccurate or withheld information provided by you, failure to follow instructions, or misuse of equipment.</li>
                <li>Nothing in these Terms limits liability where it would be unlawful to do so — including liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation.</li>
              </ol>
            </div>

            <div id="website-use">
              <h2 className="text-2xl text-foreground mb-3">Website use</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                When using this website, you agree not to misuse the site, attempt unauthorised access, or interfere with its security. You may not copy content for commercial use without permission. The site must not be used in any way that breaks applicable laws. We may update, suspend, or remove website content at any time without notice.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                These Terms and Conditions are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
