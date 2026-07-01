"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { IconEye, IconCheckCircle, IconMessageCircle, IconAccessibility, IconTarget } from "@/components/icons";

const adaptations = [
  {
    title: "Clear verbal instruction",
    body: "Every movement is described with precise, detailed verbal instruction — not demonstration. I explain what should happen in your body, what you should feel, and what to listen for rather than what to watch.",
  },
  {
    title: "Consistent equipment placement",
    body: "Equipment is always placed in the same position so you know exactly where to find it. The studio layout stays consistent so you can build spatial confidence and familiarity over time.",
  },
  {
    title: "Tactile guidance where welcome",
    body: "Where it is helpful and consented to, I use gentle physical guidance to support movement positioning. This is always your choice — we will discuss what works best for you.",
  },
  {
    title: "Time to familiarise",
    body: "Sessions for new clients include extra time to learn the space, the equipment, and the movement patterns before progressing. There is no rush. Confidence in the environment comes first.",
  },
  {
    title: "Private, stable environment",
    body: "The private studio means no other people to navigate around, no unexpected noise or movement from other clients, and a calm, predictable space every session.",
  },
  {
    title: "Sport-specific programming",
    body: "I work with visually impaired clients engaged in showdown and other adapted sports. If you have a sport-specific goal, sessions can be built around the demands of that activity.",
  },
];

export default function VisualImpairmentClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section className="ef-section" style={{ background: "var(--color-ink)", paddingTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 24 }}>Visual Impairment</p>
          <h1 style={{ fontSize: "clamp(36px, 4.5vw, 62px)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760, marginBottom: 24 }}>
            Personal Training for<br />Visually Impaired People
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            One-to-one training adapted for people who are blind or partially sighted. Sessions are built
            entirely around clear verbal instruction, consistent environment, and your specific goals — whether
            that is general fitness, a specific health condition, or sport.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="ef-btn ef-btn-primary" onClick={openDialog}>Book a Free Consultation</button>
          </div>
        </div>
      </section>

      {/* EXPERIENCE CALLOUT */}
      <section style={{ background: "var(--color-teal)", padding: "28px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ color: "#fff", flexShrink: 0 }}>
            <IconEye style={{ width: 36, height: 36 }} />
          </div>
          <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.55, margin: 0 }}>
            I currently work with visually impaired clients in Worthing, including people engaged in showdown —
            a competitive sport for blind and partially sighted people. This is an area I am actively developing.
          </p>
        </div>
      </section>

      {/* HOW SESSIONS WORK */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "5fr 6fr", gap: 80, alignItems: "start" }}>
          <div>
            <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>The Approach</p>
            <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 20 }}>
              Training that works without sight
            </h2>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              Most personal training relies heavily on visual demonstration — watch me, do what I do. That does not
              work for VIP clients, and attempting it is both ineffective and exclusionary.
            </p>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              My approach for visually impaired clients is built around precise verbal instruction, proprioceptive
              awareness, and a consistent, predictable environment. You learn to feel the movement correctly rather
              than see it — which, for many people, produces a more mindful and connected training experience anyway.
            </p>
            <p className="ef-body" style={{ fontSize: 16 }}>
              The private studio format is particularly suited to VIP training — no crowds, no unexpected movement,
              no pressure to navigate a busy gym floor. Just you, me, and a focused session.
            </p>
          </div>
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", aspectRatio: "4/3", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
            <Image
              src="/images/studio-2.jpg"
              alt="Private training studio — calm, consistent environment for visually impaired clients"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* ADAPTATIONS */}
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>How Sessions Are Adapted</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 500 }}>
            What Makes VIP Training Different
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {adaptations.map(({ title, body }) => (
              <div key={title} className="ef-card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{title}</h3>
                <p className="ef-body" style={{ fontSize: 14.5 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>Common Questions</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(24px, 2.6vw, 36px)", color: "var(--color-ink)", marginBottom: 48 }}>
            Questions About VIP Personal Training
          </h2>
          <div className="flex flex-col gap-5">
            {[
              {
                q: "Can I do personal training if I am blind or partially sighted?",
                a: "Yes. Personal training is very achievable for visually impaired people with the right approach. Sessions rely on verbal instruction, consistent environment, and tactile guidance — not visual demonstration.",
                icon: IconCheckCircle,
              },
              {
                q: "How do you describe exercises without showing me?",
                a: "I describe what should happen in your body — which muscles should be working, what you should feel in your joints, what the movement should feel like at different points. Many clients find this produces a more aware and connected training experience than watching someone else.",
                icon: IconMessageCircle,
              },
              {
                q: "I have some remaining vision — does that matter?",
                a: "We will work with whatever you have. Sessions are adapted to your specific visual situation — whether that is complete blindness, significant partial sight, or anything in between. Your experience, not a label, guides the approach.",
                icon: IconAccessibility,
              },
              {
                q: "Do you have experience with showdown or other VIP sports?",
                a: "Yes. I currently work with clients engaged in showdown and I am actively developing my knowledge and approach in this area. If you have a sport-specific goal, that can absolutely inform your training programme.",
                icon: IconTarget,
              },
            ].map(({ q, a, icon: Icon }) => (
              <div key={q} className="ef-card">
                <div className="w-12 h-12 rounded-full bg-teal/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-teal" />
                </div>
                <h3 className="text-foreground" style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.01em" }}>{q}</h3>
                <p className="ef-body" style={{ fontSize: 15 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
