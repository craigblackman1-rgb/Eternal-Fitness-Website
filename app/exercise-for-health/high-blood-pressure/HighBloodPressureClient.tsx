"use client";

import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { IconBloodPressure } from "@/components/icons";

const approachPoints = [
  {
    title: "Pre-session monitoring",
    body: "I take your blood pressure before every session to confirm it is safe to exercise. This gives us a reliable baseline and lets me track how your body responds to training over time — not just session to session, but week to week.",
  },
  {
    title: "Adapted intensity management",
    body: "Some blood pressure medications affect your heart rate response, making standard heart rate zone calculations unreliable. I use Rate of Perceived Exertion (RPE) — how hard you feel you are working — alongside heart rate data to set the right intensity for each session.",
  },
  {
    title: "Progressive, not aggressive",
    body: "Exercise for hypertension should build capacity gradually. I start with moderate-intensity aerobic work and controlled resistance circuits, then progress as your fitness and blood pressure response allow. There is no rush, and pushing too hard too soon is counterproductive.",
  },
];

export default function HighBloodPressureClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div>
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section className="ef-section" style={{ background: "var(--color-ink)", paddingTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 24 }}>High Blood Pressure</p>
          <h1 style={{ fontSize: "clamp(36px, 4.5vw, 62px)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760, marginBottom: 24 }}>
            Exercise for High Blood<br />Pressure in Worthing
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            Exercise is clinically recommended for managing hypertension — but doing it safely requires
            specialist knowledge. As a Level 4 Exercise Referral Specialist, I programme around your
            blood pressure, your medications, and your capacity, with monitoring built into every session.
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
              Exercise is one of the most effective interventions for lowering blood pressure
            </h2>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              NICE guidelines and NHS exercise referral schemes consistently show that regular, moderate
              exercise can reduce both systolic and diastolic blood pressure. In some cases, the effect is
              comparable to a single antihypertensive medication.
            </p>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              But doing it safely requires understanding when blood pressure is too high to exercise,
              how different medications affect heart rate and exercise response, what movements can cause
              dangerous pressure spikes, and how to progress without risking a hypertensive response.
            </p>
            <p className="ef-body" style={{ fontSize: 16 }}>
              This is where Level 4 training matters. Standard personal trainers (Level 3) are not
              equipped to make these clinical judgments. I am.
            </p>
          </div>
          <div style={{ color: "var(--color-teal)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(8,126,139,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <IconBloodPressure style={{ width: 100, height: 100 }} />
            </div>
          </div>
        </div>
      </section>

      {/* THE APPROACH */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>The Approach</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 500 }}>
            How I Work With Blood Pressure Clients
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
            Every session starts with a check-in and a blood pressure reading. Then we work through a
            structured but adaptable programme:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                n: "01", title: "Warm-up and mobilisation",
                body: "Light cardio and mobility work to gradually increase heart rate and blood flow. No sudden starts — we ease into every session.",
              },
              {
                n: "02", title: "Main exercise block",
                body: "A combination of moderate-intensity cardio and controlled resistance work. I monitor your RPE throughout and adjust intensity immediately if needed.",
              },
              {
                n: "03", title: "Cool-down and recovery",
                body: "Guided cool-down to bring your heart rate and blood pressure back to baseline gradually. Breathing work and gentle stretching to support recovery.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ padding: "28px 0", borderTop: "1px solid var(--color-border-warm)" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "var(--color-rose)", opacity: 0.18, lineHeight: 0.85, marginBottom: 20, letterSpacing: "-0.05em" }}>{n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10, letterSpacing: "-0.018em", lineHeight: 1.2 }}>{title}</h3>
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
            Questions About Exercising With High Blood Pressure
          </h2>
          {[
            {
              q: "Is exercise safe if I have high blood pressure?",
              a: "Yes — in most cases, exercise is both safe and clinically recommended for managing hypertension. Moderate-intensity exercise has been shown to reduce systolic blood pressure by 5–10 mmHg in some cases. The key is having a qualified specialist who monitors your response and programmes appropriately.",
            },
            {
              q: "What type of exercise helps lower blood pressure?",
              a: "A combination of moderate aerobic exercise and resistance training is most effective. I use steady-state cardio, circuit-style resistance work, and controlled rhythmic movements — all monitored and adapted to your individual response.",
            },
            {
              q: "Can I train if I take blood pressure medication?",
              a: "Yes. Many of my clients take antihypertensives. Some medications affect heart rate response, which is why I use RPE — how hard you feel you are working — alongside heart rate data to guide intensity. I will never push beyond what is safe for your specific situation.",
            },
            {
              q: "How quickly will I see improvements?",
              a: "Many clients notice their blood pressure readings trending lower within 4–6 weeks of consistent training. But the timeframe depends on your starting point, medication, and other health factors. I track your readings session by session so we can see what is working.",
            },
          ].map(({ q, a }) => (
            <div key={q} style={{ padding: "24px 0", borderTop: "1px solid var(--color-border-warm)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10, letterSpacing: "-0.01em" }}>{q}</h3>
              <p className="ef-body" style={{ fontSize: 15 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
