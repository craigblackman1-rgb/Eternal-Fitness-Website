"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { IconRibbon, IconActivity, IconAlertCircle, IconBone, IconClipboardCheck, IconHeartHandshake, IconClock, IconUserPlus } from "@/components/icons";

const stages = [
  {
    title: "During active treatment",
    body: "Chemotherapy and radiotherapy significantly affect energy, immune function, and physical capacity — and those effects are unpredictable from week to week. Sessions during active treatment are lower intensity, shorter, and built around your current treatment schedule. Every session begins with a check-in.",
  },
  {
    title: "In remission",
    body: "Remission brings its own challenges — rebuilding fitness that has been lost, managing ongoing fatigue or side effects, and navigating the physical and emotional after-effects of treatment. Sessions progress gradually, respecting the timeline your body needs.",
  },
  {
    title: "Post-surgery",
    body: "Whether mastectomy, colostomy, lymph node removal, or another procedure — post-surgical return to exercise requires careful, staged progression. I work within the guidance of your surgical team and will not progress any movement without appropriate medical clearance.",
  },
];

const considerations = [
  {
    title: "Cancer-related fatigue is different",
    body: "Cancer-related fatigue (CRF) does not respond to rest the way ordinary tiredness does. It is physiologically distinct — and training must account for it. I will never push through CRF or interpret it as effort avoidance.",
    icon: IconActivity,
  },
  {
    title: "Lymphoedema awareness",
    body: "For clients with or at risk of lymphoedema, I monitor for signs of swelling, avoid tight compression, and follow safe exercise guidelines. Exercise can actually help manage lymphoedema when programmed correctly.",
    icon: IconAlertCircle,
  },
  {
    title: "Bone density",
    body: "Some cancer treatments (particularly certain hormonal therapies) accelerate bone density loss. Weight-bearing and resistance exercise is clinically recommended — but load and progression must be managed carefully.",
    icon: IconBone,
  },
  {
    title: "GP or oncologist sign-off",
    body: "Before beginning any structured exercise programme during or shortly after treatment, I ask for GP or oncologist clearance. This is non-negotiable — not because I am being cautious, but because it is the right clinical standard.",
    icon: IconClipboardCheck,
  },
];

const faqs = [
  {
    q: "Is it safe to exercise during cancer treatment?",
    a: "Evidence now strongly supports exercise during cancer treatment — at the right intensity and with the right guidance. The programme must account for your specific treatment, side effects, and current capacity. I will always ask for GP or oncologist sign-off before beginning.",
    icon: IconClipboardCheck,
  },
  {
    q: "What is cancer-related fatigue and how do you account for it?",
    a: "Cancer-related fatigue (CRF) is physiologically different from ordinary tiredness — it does not improve with rest in the same way. I am trained to recognise CRF and programme around it. Sessions may be shorter or lower in intensity on harder days. That is not failure — it is appropriate clinical management.",
    icon: IconClock,
  },
  {
    q: "When can I start exercising after surgery?",
    a: "This depends entirely on the type of surgery and your recovery. I work with the guidance of your surgical team and will not progress any movement without appropriate medical clearance.",
    icon: IconHeartHandshake,
  },
  {
    q: "Do you work with people during active treatment?",
    a: "Yes. I work with people during active chemotherapy or radiotherapy, people in remission, and those who have finished treatment but are rebuilding. Each stage requires a different approach — the programme is built around where you are right now.",
    icon: IconUserPlus,
  },
];

export default function CancerRehabClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section className="ef-section" style={{ background: "var(--color-ink)", paddingTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 24 }}>Cancer Rehabilitation</p>
          <h1 style={{ fontSize: "clamp(36px, 4.5vw, 62px)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760, marginBottom: 24 }}>
            Personal Training for<br />Cancer Rehabilitation
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            Specialist one-to-one support during treatment, in remission, and post-surgery.
            Exercise is now strongly evidenced as beneficial throughout the cancer journey — with the right
            guidance, at the right intensity, from someone qualified to provide it.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="ef-btn ef-btn-primary" onClick={openDialog}>Book a Free Consultation</button>
          </div>
        </div>
      </section>

      {/* QUALIFICATION CALLOUT */}
      <section style={{ background: "var(--color-rose)", padding: "28px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ color: "#fff", flexShrink: 0 }}>
            <IconRibbon style={{ width: 36, height: 36 }} />
          </div>
          <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.55, margin: 0 }}>
            <strong>Cancer Rehabilitation Specialist qualification</strong> — trained at Level 4 to work with
            people during and after cancer treatment. This is a specialist qualification, not standard personal training.
          </p>
        </div>
      </section>

      {/* WHY EXERCISE */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>The Evidence</p>
            <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 20 }}>
              Why exercise matters during the cancer journey
            </h2>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              Exercise during and after cancer treatment is no longer considered risky — the evidence now
              strongly supports it. Research shows that appropriate exercise during chemotherapy is associated
              with reduced fatigue, better mood, improved immune function, and faster recovery.
            </p>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              After treatment, structured exercise has been shown to improve overall survival rates in some
              cancer types, reduce the risk of recurrence, and significantly improve quality of life.
            </p>
            <p className="ef-body" style={{ fontSize: 16 }}>
              The qualifier is &ldquo;appropriate.&rdquo; The intensity, type of exercise, and how it adapts to
              treatment side effects matters enormously — and that is where specialist training is essential.
            </p>
          </div>
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", aspectRatio: "4/5", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <Image
              src="/images/esther-about.jpg"
              alt="Esther Fair — Cancer Rehabilitation Specialist in Worthing"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </section>

      {/* STAGES */}
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>When I Can Help</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 500 }}>
            Support at Every Stage
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {stages.map(({ title, body }, i) => (
              <div key={title} className="ef-card" style={{ padding: "28px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-rose)", marginBottom: 12 }}>
                  0{i + 1}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-ink)", marginBottom: 12, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{title}</h3>
                <p className="ef-body" style={{ fontSize: 14.5 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT I KNOW */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>Clinical Considerations</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 3vw, 40px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 560 }}>
            What I Know and How I Work
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {considerations.map(({ title, body, icon: Icon }) => (
              <div key={title} className="ef-card">
                <div className="w-12 h-12 rounded-full bg-teal/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-teal" />
                </div>
                <h3 className="text-foreground" style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h3>
                <p className="ef-body" style={{ fontSize: 14.5 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>Questions</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(24px, 2.6vw, 36px)", color: "var(--color-ink)", marginBottom: 48 }}>
            Common Questions About Cancer Rehabilitation
          </h2>
          <div className="flex flex-col gap-5">
            {faqs.map(({ q, a, icon: Icon }) => (
              <div key={q} className="ef-card">
                <div className="w-12 h-12 rounded-full bg-rose/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-rose" />
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
