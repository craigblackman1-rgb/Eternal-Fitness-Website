"use client";

import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { IconBone, IconMove, IconDumbbell, IconAccessibility, IconCheckCircle, IconAlertTriangle, IconClock, IconClipboardList } from "@/components/icons";

const approachPoints = [
  {
    title: "Assessment first",
    body: "Before we begin, I need to understand your bone health status — DEXA scan results if you have them, any previous fractures, your current medical guidance, and what your specialist has recommended. This determines what is safe and what is not.",
  },
  {
    title: "Controlled, progressive loading",
    body: "Bone responds to load. Resistance exercises like squats, lunges, presses, and rows — at the right intensity — stimulate bone density adaptation. I programme loading that challenges bone without exceeding what your skeleton can safely tolerate at your current stage.",
  },
  {
    title: "Balance and fall prevention",
    body: "Building bone density takes time. Reducing your risk of falling has an immediate effect on fracture risk. Every programme includes balance work, proprioception exercises, and mobility training to keep you steady and confident on your feet.",
  },
];

export default function BoneHealthClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section className="ef-section" style={{ background: "var(--color-ink)", paddingTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 24 }}>Bone Health</p>
          <h1 style={{ fontSize: "clamp(36px, 4.5vw, 62px)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760, marginBottom: 24 }}>
            Exercise for Osteoporosis and<br />Bone Health in Worthing
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            Weight-bearing and resistance exercise is clinically recommended for maintaining bone density
            and reducing fracture risk. I programme safe, progressive strength work for people with
            osteopenia, osteoporosis, and anyone concerned about their bone health as they age.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="ef-btn ef-btn-primary" onClick={openDialog}>Book a Free Consultation</button>
          </div>
        </div>
      </section>

      {/* WHY EXERCISE MATTERS */}
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>Why It Matters</p>
            <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 20 }}>
              Your bones respond to the demands you place on them
            </h2>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              Bone is living tissue. It adapts and strengthens when loaded appropriately — just like muscle.
              This is why weight-bearing and resistance exercise is the single most effective
              non-pharmacological intervention for bone density.
            </p>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              But when you have osteoporosis, the margin for error is narrow. Too little loading will not
              stimulate bone adaptation. Too much — or the wrong type of loading — can increase fracture
              risk. Getting it right requires knowing exactly what your skeleton can tolerate and how to
              progress it safely.
            </p>
            <p className="ef-body" style={{ fontSize: 16 }}>
              As a Level 4 Personal Trainer with specialist training in exercise referral and clinical
              populations, I am qualified to make these assessments. Your safety is built into every
              decision I make about loading, progression, and exercise selection.
            </p>
          </div>
          <div style={{ color: "var(--color-teal)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(8,126,139,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <IconBone style={{ width: 100, height: 100 }} />
            </div>
          </div>
        </div>
      </section>

      {/* THE APPROACH */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>The Approach</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 500 }}>
            Building Bone Safely
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {approachPoints.map(({ title, body }) => (
              <div key={title} className="ef-card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{title}</h3>
                <p className="ef-body" style={{ fontSize: 14.5 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT SESSIONS LOOK LIKE */}
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>Session Structure</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 20, maxWidth: 500 }}>
            What Your Sessions Would Look Like
          </h2>
          <p className="ef-body" style={{ fontSize: 16, maxWidth: 600, marginBottom: 48 }}>
            Each session is structured around safe loading, balance, and functional movement. Here is
            the general framework:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                n: "01", title: "Mobilisation and activation",
                body: "We start with gentle mobility work and muscle activation to prepare your joints and skeleton for loading. Good movement quality comes before any load is added.",
                icon: IconMove,
              },
              {
                n: "02", title: "Resistance and weight-bearing work",
                body: "The main block focuses on compound resistance exercises — squats, presses, rows, lunges — at controlled loads that stimulate bone without exceeding safe thresholds. Impact is introduced carefully where appropriate.",
                icon: IconDumbbell,
              },
              {
                n: "03", title: "Balance and cool-down",
                body: "Balance exercises to reduce fall risk, followed by a guided cool-down. Proprioception work — your body's awareness of where it is in space — is a key part of fracture prevention and we build it into every session.",
                icon: IconAccessibility,
              },
            ].map(({ n, title, body, icon: Icon }) => (
              <div key={n} className="ef-card">
                <div className="w-12 h-12 rounded-full bg-rose/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-rose" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-rose)", marginBottom: 8 }}>{n}</div>
                <h3 className="text-foreground" style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.018em", lineHeight: 1.2 }}>{title}</h3>
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
            Questions About Exercising With Osteoporosis
          </h2>
          <div className="flex flex-col gap-5">
            {[
              {
                q: "Is exercise safe if I have osteoporosis?",
                a: "Yes — exercise is clinically recommended for managing osteoporosis and reducing fracture risk. Weight-bearing and resistance exercises strengthen bone, while balance work reduces fall risk. A qualified specialist will know which movements are appropriate for your specific bone health status.",
                icon: IconCheckCircle,
              },
              {
                q: "What exercises should I avoid with osteoporosis?",
                a: "High-impact activities, uncontrolled twisting of the spine, heavy forward flexion (bending at the waist to touch your toes), and exercises that place excessive load through a fracture-prone area all need careful consideration. I assess your individual risk profile and programme around it.",
                icon: IconAlertTriangle,
              },
              {
                q: "How quickly can exercise improve bone density?",
                a: "Bone adaptation is slower than muscle adaptation — measurable changes on a DEXA scan typically take 6–12 months of consistent training. But improvements in strength, balance, and confidence happen much sooner, and these have an immediate impact on your quality of life and fracture risk.",
                icon: IconClock,
              },
              {
                q: "Do I need a recent DEXA scan to start?",
                a: "It helps, but it is not essential. If you have a recent DEXA scan result that gives me your T-score and any fracture history, I can programme more precisely. If you do not have one, I will work with your diagnosis, your symptoms, and your medical guidance to keep you safe.",
                icon: IconClipboardList,
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
