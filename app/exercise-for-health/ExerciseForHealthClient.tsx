"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import {
  Section,
  SectionHeading,
  PageHero,
  FeatureCard,
  StatBadge,
  CTABand,
  Reveal,
  CtaButton,
} from "@/components/ds";
import {
  IconHeart,
  IconBloodPressure,
  IconBone,
  IconDiabetes,
  IconLungs,
  IconEye,
  IconAccessibility,
  IconMove,
  IconClipboardList,
  IconMessageCircle,
  IconActivity,
  IconCheckCircle,
  IconFileText,
  IconAward,
  IconHeartHandshake,
} from "@/components/icons";

const conditions = [
  {
    icon: IconBloodPressure,
    title: "High Blood Pressure",
    slug: "high-blood-pressure",
    desc: "Exercise is one of the most effective ways to lower blood pressure — when it is done safely and progressively. I am qualified in exercise referral for hypertension.",
    available: true,
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
    available: true,
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

const steps = [
  {
    title: "Free consultation first",
    body: "We start with a conversation — no commitment, no obligation. I want to understand your condition, your history, and your goals before we do anything else.",
    icon: IconClipboardList,
  },
  {
    title: "Check-in at the start of every session",
    body: "How are you feeling today? Energy, pain, sleep, any changes. The session plan is finalised then — because what works one week may not be right the next.",
    icon: IconMessageCircle,
  },
  {
    title: "Progress that adapts to you",
    body: "There is no fixed template. Programmes are built around your body, your condition, and your goals — and adjusted as those things change.",
    icon: IconActivity,
  },
];

const faqs = [
  {
    title: "Can I exercise if I have a health condition?",
    body: "In most cases, yes — and the evidence strongly supports it. Exercise is clinically recommended for a wide range of conditions. The key is having a qualified specialist who understands your specific condition and can programme safely around it.",
    icon: IconCheckCircle,
  },
  {
    title: "Do I need a GP referral?",
    body: "No. A GP referral is welcome but not required. Many clients come independently. I will ask about your medical history and may recommend checking with your GP if there are specific contraindications to consider first.",
    icon: IconFileText,
  },
  {
    title: "How is this different from a regular personal trainer?",
    body: "A standard Level 3 PT is not trained to work with clinical populations. As a Level 4 Exercise Referral Specialist, I understand contraindicated exercises, medication effects, fatigue management, and how conditions affect capacity from one session to the next.",
    icon: IconAward,
  },
  {
    title: "What if I am having a bad day when I come in?",
    body: "That is what the check-in is for. I adapt the session to how you actually feel — not how the plan says you should feel. You will always leave having done something genuinely useful, even on the difficult days.",
    icon: IconHeartHandshake,
  },
];

export default function ExerciseForHealthClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const bookCta = { label: "Book a Free Consultation", onClick: openDialog, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/who-health.jpg"
        imageAlt="Personal training for health conditions in Worthing"
        eyebrow="Exercise for Health"
        heading={<>Personal Training for<br />Health Conditions</>}
        subhead="Exercise is one of the most evidence-based interventions for managing a wide range of health conditions. The key is having a qualified specialist who understands your condition and programmes safely around it — not a standard PT working outside their training."
        primaryCta={bookCta}
        secondaryCta={{ label: "See Conditions Covered", href: "#conditions", variant: "ghost-white" }}
        badge={<StatBadge variant="rose" value="L4" label="Exercise Referral Specialist" />}
      />

      {/* THE APPROACH */}
      <Section background="white">
        <div className="ds-split">
          <Reveal y={40} className="ds-split-img">
            <Image
              src="/images/esther-training.jpg"
              alt="Esther Fair — Exercise for health conditions specialist in Worthing"
              fill
              sizes="(max-width: 1000px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="The Approach"
              eyebrowColor="teal"
              heading="Exercise for health is different from exercise for fitness"
            />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>
                Think of it like seeing a physiotherapist rather than a personal trainer. The goal is not weight loss,
                not aesthetics, and not performance. The goal is health — managing your condition, building functional
                strength, improving quality of life.
              </p>
              <p className="ds-body" style={{ marginBottom: 16 }}>
                I work the same way a physio or an osteopath does — targeting conditions, not demographics. Every session
                starts with a check-in. The plan for that day is set then, based on how you actually feel — not how you
                felt last week.
              </p>
              <p className="ds-body" style={{ marginBottom: 28 }}>
                As a Level 4 Personal Trainer and Exercise Referral Specialist, I am qualified to work with clinical
                populations that a standard Level 3 PT is not trained for. That distinction matters.
              </p>
              <CtaButton cta={bookCta} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* CONDITIONS GRID */}
      <Section background="cream" id="conditions">
        <SectionHeading
          eyebrow="Conditions Covered"
          heading="Who I Work With"
          intro="If your condition is not listed here, please still get in touch. The answer is almost always yes."
        />
        <Reveal className="ds-grid-3" stagger={0.1} y={48} start="top 80%" >
          {conditions.map(({ icon: Icon, title, slug, desc, available }) => (
            <div key={slug} className="ds-card">
              <div className="ds-card-ic ds-card-ic-teal">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="ds-card-title">{title}</h4>
              <p className="ds-card-body" style={{ marginBottom: 16 }}>{desc}</p>
              {available ? (
                <Link href={`/exercise-for-health/${slug}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--color-rose)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Learn more →
                </Link>
              ) : (
                <button onClick={openDialog} style={{ fontSize: 13, fontWeight: 600, color: "var(--color-teal)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Book a consultation →
                </button>
              )}
            </div>
          ))}
        </Reveal>
      </Section>

      {/* HOW IT WORKS */}
      <Section background="white">
        <SectionHeading eyebrow="How It Works" eyebrowColor="teal" heading="What to Expect from Your Sessions" />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {steps.map((s) => (
            <FeatureCard key={s.title} icon={s.icon} accent="rose" title={s.title} body={s.body} />
          ))}
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section background="cream">
        <SectionHeading eyebrow="Common Questions" heading="Questions About Exercising With a Health Condition" />
        <Reveal className="ds-grid-2" stagger={0.12} y={48} start="top 80%">
          {faqs.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} accent="teal" title={f.title} body={f.body} />
          ))}
        </Reveal>
      </Section>

      <CTABand
        image="/images/studio-1.jpg"
        heading="Ready to find out if this is right for you?"
        body="The first conversation is free, with no commitment. I work with a small number of clients at a time — so every person gets my full attention."
        primaryCta={{ label: "Book a Free Consultation", onClick: openDialog }}
        secondaryCta={{ label: "Call: 07517 658 128", href: "tel:07517658128", variant: "ghost-white" }}
      />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
