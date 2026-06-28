"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import {
  IconHeart,
  IconBloodPressure,
  IconBone,
  IconDiabetes,
  IconLungs,
  IconEye,
  IconAccessibility,
  IconMove,
} from "@/components/icons";

const conditions = [
  {
    icon: IconBloodPressure,
    title: "High Blood Pressure",
    slug: "high-blood-pressure",
    desc: "Exercise is one of the most effective ways to lower blood pressure — when it is done safely and progressively. I am qualified in exercise referral for hypertension.",
    available: false,
  },
  {
    icon: IconDiabetes,
    title: "Type 2 Diabetes",
    slug: "type-2-diabetes",
    desc: "Structured exercise improves insulin sensitivity and blood sugar management. Sessions are planned around your medication timing and monitoring needs.",
    available: false,
  },
  {
    icon: IconBone,
    title: "Bone Health & Osteoporosis",
    slug: "bone-health",
    desc: "Weight-bearing and resistance exercise is clinically recommended to slow bone density loss and reduce fracture risk. Safe, load-managed progression.",
    available: false,
  },
  {
    icon: IconEye,
    title: "Visual Impairment",
    slug: "visual-impairment",
    desc: "Adapted training for people who are blind or partially sighted. Sessions built around clear verbal instruction, consistent equipment placement, and a familiar environment.",
    available: true,
  },
  {
    icon: IconLungs,
    title: "COPD & Breathing Conditions",
    slug: "copd",
    desc: "Exercise is recommended for people with COPD to improve function and quality of life. Sessions respect breathing capacity and build gradually.",
    available: false,
  },
  {
    icon: IconHeart,
    title: "Heart Conditions",
    slug: "heart-conditions",
    desc: "Post-cardiac rehabilitation and ongoing heart condition management. I work within the guidance of your cardiologist or GP.",
    available: false,
  },
  {
    icon: IconMove,
    title: "Chronic Pain & Fibromyalgia",
    slug: "chronic-pain",
    desc: "Gentle, progressive movement that works with pain rather than against it. Sessions adapt to your energy and pain levels on the day.",
    available: false,
  },
  {
    icon: IconAccessibility,
    title: "Physical Disability & Adaptive Training",
    slug: "adaptive-training",
    desc: "Exercise programmes built entirely around your body and your goals — not a template. Wheelchair users, amputees, and neurological conditions welcome.",
    available: false,
  },
];

export default function ExerciseForHealthClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div>
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section className="ef-section" style={{ background: "var(--color-ink)", paddingTop: 120 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 24 }}>Exercise for Health</p>
          <h1 style={{ fontSize: "clamp(36px, 4.5vw, 62px)", fontWeight: 700, color: "#fff", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 760, marginBottom: 24 }}>
            Personal Training for<br />Health Conditions
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 580, marginBottom: 40 }}>
            Exercise is one of the most evidence-based interventions for managing a wide range of health conditions.
            The key is having a qualified specialist who understands your condition and programmes safely around it —
            not a standard PT working outside their training.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="ef-btn ef-btn-primary" onClick={openDialog}>Book a Free Consultation</button>
            <a href="#conditions" className="ef-btn ef-btn-outline" style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}>See Conditions Covered</a>
          </div>
        </div>
      </section>

      {/* WHAT THIS IS */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", aspectRatio: "4/5", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
            <Image
              src="/images/esther-training.jpg"
              alt="Esther Fair — Exercise for health conditions specialist in Worthing"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>The Approach</p>
            <h2 className="ef-h2" style={{ fontSize: "clamp(28px, 3vw, 42px)", color: "var(--color-ink)", marginBottom: 20 }}>
              Exercise for health is different from exercise for fitness
            </h2>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              Think of it like seeing a physiotherapist rather than a personal trainer. The goal is not weight loss,
              not aesthetics, and not performance. The goal is health — managing your condition, building functional
              strength, improving quality of life.
            </p>
            <p className="ef-body" style={{ marginBottom: 16, fontSize: 16 }}>
              I work the same way a physio or an osteopath does — targeting conditions, not demographics. Every session
              starts with a check-in. The plan for that day is set then, based on how you actually feel — not how you
              felt last week.
            </p>
            <p className="ef-body" style={{ fontSize: 16 }}>
              As a Level 4 Personal Trainer and Exercise Referral Specialist, I am qualified to work with clinical
              populations that a standard Level 3 PT is not trained for. That distinction matters.
            </p>
          </div>
        </div>
      </section>

      {/* CONDITIONS GRID */}
      <section id="conditions" className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>Conditions Covered</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(28px, 3vw, 42px)", color: "var(--color-ink)", marginBottom: 14, maxWidth: 600 }}>
            Who I Work With
          </h2>
          <p className="ef-body" style={{ fontSize: 16, maxWidth: 560, marginBottom: 56 }}>
            If your condition is not listed here, please still get in touch.
            The answer is almost always yes.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {conditions.map(({ icon: Icon, title, slug, desc, available }) => (
              <div key={slug} className="ef-card" style={{ padding: "28px 28px 24px" }}>
                <div style={{ color: "var(--color-teal)", marginBottom: 16 }}>
                  <Icon className="w-8 h-8" style={{ width: 36, height: 36 }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-ink)", marginBottom: 10, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                  {title}
                </h3>
                <p className="ef-body" style={{ fontSize: 14, marginBottom: 16 }}>{desc}</p>
                {available ? (
                  <Link
                    href={`/exercise-for-health/${slug}`}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--color-rose)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    Learn more →
                  </Link>
                ) : (
                  <button
                    onClick={openDialog}
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--color-teal)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Book a consultation →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ef-section" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-teal" style={{ marginBottom: 20 }}>How It Works</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(28px, 3vw, 42px)", color: "var(--color-ink)", marginBottom: 56, maxWidth: 500 }}>
            What to Expect from Your Sessions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[
              {
                n: "01",
                title: "Free consultation first",
                body: "We start with a conversation — no commitment, no obligation. I want to understand your condition, your history, and your goals before we do anything else.",
              },
              {
                n: "02",
                title: "Check-in at the start of every session",
                body: "How are you feeling today? Energy, pain, sleep, any changes. The session plan is finalised then — because what works one week may not be right the next.",
              },
              {
                n: "03",
                title: "Progress that adapts to you",
                body: "There is no fixed template. Programmes are built around your body, your condition, and your goals — and adjusted as those things change.",
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
      <section className="ef-section" style={{ background: "var(--color-warm)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p className="ef-eyebrow ef-eyebrow-rose" style={{ marginBottom: 20 }}>Common Questions</p>
          <h2 className="ef-h2" style={{ fontSize: "clamp(26px, 2.8vw, 38px)", color: "var(--color-ink)", marginBottom: 48 }}>
            Questions About Exercising With a Health Condition
          </h2>
          {[
            {
              q: "Can I exercise if I have a health condition?",
              a: "In most cases, yes — and the evidence strongly supports it. Exercise is clinically recommended for a wide range of conditions. The key is having a qualified specialist who understands your specific condition and can programme safely around it.",
            },
            {
              q: "Do I need a GP referral?",
              a: "No. A GP referral is welcome but not required. Many clients come independently. I will ask about your medical history and may recommend checking with your GP if there are specific contraindications to consider first.",
            },
            {
              q: "How is this different from a regular personal trainer?",
              a: "A standard Level 3 PT is not trained to work with clinical populations. As a Level 4 Exercise Referral Specialist, I understand contraindicated exercises, medication effects, fatigue management, and how conditions affect capacity from one session to the next.",
            },
            {
              q: "What if I am having a bad day when I come in?",
              a: "That is what the check-in is for. I adapt the session to how you actually feel — not how the plan says you should feel. You will always leave having done something genuinely useful, even on the difficult days.",
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
