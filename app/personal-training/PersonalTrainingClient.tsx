"use client";

import Image from "next/image";
import {
  IconActivity,
  IconAward,
  IconBloodPressure,
  IconClipboardList,
  IconHeart,
  IconMessageCircle,
  IconUsers,
} from "@/components/icons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import {
  Section,
  SectionHeading,
  PageHero,
  FeatureCard,
  SpecialistGrid,
  StatBadge,
  CTABand,
  Reveal,
  CtaButton,
  ProcessFlow,
  StatStrip,
} from "@/components/ds";

const specialistAreas = [
  {
    title: "Cancer & cancer rehabilitation",
    desc: "During active treatment, in remission, or post-surgery. I am qualified in cancer rehabilitation and adapt to wherever you are in your journey.",
    image: "/images/specialise-1.jpg",
    href: "/cancer-rehabilitation",
  },
  {
    title: "Chronic health conditions",
    desc: "Including autoimmune conditions, fibromyalgia, ME/CFS, heart conditions, diabetes, and more. Every session adapts to what your body can manage that day.",
    image: "/images/specialise-2.jpg",
    href: "/exercise-for-health",
  },
  {
    title: "Disability & adaptive training",
    desc: "Physical disabilities, significant mobility limitations, and sensory impairments including visual impairment. Programmes are built around your body, not a template.",
    image: "/images/specialise-3.jpg",
    href: "/exercise-for-health/visual-impairment",
  },
  {
    title: "GP-referred exercise",
    desc: "I am qualified in exercise referral and experienced in working alongside medical guidance from GPs and healthcare teams.",
    image: "/images/services-training.jpg",
    href: "/exercise-for-health",
  },
  {
    title: "Injury recovery & rehabilitation",
    desc: "Post-surgical, post-fracture, and musculoskeletal conditions. I work within the guidance of your physiotherapist or consultant.",
    image: "/images/mobility-movement.jpg",
  },
  {
    title: "Neurological conditions",
    desc: "Including Parkinson's, MS, stroke recovery, and acquired brain injury. Gentle, progressive, and always adapted.",
    image: "/images/mind-body.jpg",
  },
];

const focusCards = [
  {
    title: "Mobility and joint health",
    desc: "Improving range of motion, reducing stiffness, and moving with less effort and pain day-to-day.",
  },
  {
    title: "Functional strength",
    desc: "Building practical strength for real life — carrying shopping, climbing stairs, getting up from the floor.",
  },
  {
    title: "Balance and stability",
    desc: "Reducing fall risk and building the physical confidence to move through your environment safely.",
  },
  {
    title: "Fatigue management",
    desc: "Learning how to train effectively when energy levels are variable or unpredictable — a common challenge with many health conditions.",
  },
];

const steps = [
  {
    title: "Free Consultation",
    desc: "A relaxed 30-minute conversation with me about your goals, health history, and what has and has not worked before. No pressure, no commitment.",
  },
  {
    title: "Movement Assessment",
    desc: "I check your current mobility, strength, and any limitations before any programme begins — so training starts safely and clearly.",
  },
  {
    title: "Your Programme",
    desc: "A plan built entirely around your body and your life. Session structure, exercises, and intensity are all tailored specifically to you.",
  },
  {
    title: "Ongoing Support",
    desc: "I adjust your programme as your health and capacity change — keeping training sustainable, realistic, and aligned with where you are.",
  },
];

const specialistPages = [
  { href: "/exercise-for-health", title: "Exercise for Health", desc: "Training for high blood pressure, type 2 diabetes, osteoporosis, COPD, heart conditions, chronic pain and more.", image: "/images/services-training.jpg", imageAlt: "Exercise for Health" },
  { href: "/cancer-rehabilitation", title: "Cancer Rehabilitation", desc: "Training during active treatment, in remission, or post-surgery. Qualified and experienced in cancer rehabilitation.", image: "/images/specialise-1.jpg", imageAlt: "Cancer Rehabilitation" },
  { href: "/exercise-for-health/visual-impairment", title: "Visual Impairment", desc: "Adapted training for people who are blind or partially sighted. Verbal instruction, consistent environment, tactile guidance.", image: "/images/specialise-3.jpg", imageAlt: "Visual Impairment" },
];

const relatedArticles = [
  {
    href: "/blog/exercise-illness",
    title: "Exercise & Illness",
    desc: "Understanding how to stay active during health challenges and what's safe when managing chronic conditions.",
    icon: IconActivity,
  },
  {
    href: "/blog/menopause-and-exercise",
    title: "Menopause & Exercise",
    desc: "How to train effectively through hormonal changes and manage strength, mobility, and energy during midlife transitions.",
    icon: IconHeart,
  },
  {
    href: "/blog/myth-buster-does-resistance-training-cause-high-blood-pressure",
    title: "Resistance Training & Blood Pressure",
    desc: "Safety considerations for people managing cardiovascular health and how resistance training can be part of a healthy approach.",
    icon: IconBloodPressure,
  },
];

export default function PersonalTrainingClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const bookCta = { label: "Book a Free Consultation", onClick: openDialog, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/pt-hero.jpg"
        imageAlt="Personal training in Worthing for health conditions and complex needs"
        eyebrow="Personal Training"
        heading="Cancer Rehabilitation and Recovery Training in Worthing"
        subhead="Private one-to-one sessions with a Cancer Rehabilitation Specialist and Exercise Referral Specialist (Level 4 qualified). Whether you are in cancer treatment, post-surgery recovery, managing a chronic condition, living with a disability, or have complex medical needs — there is a specialist programme here for you."
        primaryCta={bookCta}
        secondaryCta={{ label: "What Sessions Involve", href: "#what", variant: "ghost-white" }}
        badge={<StatBadge variant="rose" value="L4" label="Cancer Rehab & Exercise Referral" />}
      />

      {/* What to Expect */}
      <Section background="white" id="what">
        <div className="ds-split">
          <div>
            <SectionHeading
              eyebrow="What to Expect"
              heading="This Is Not Like Other Personal Training"
            />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>
                Personal training at Eternal Fitness is not about pushing harder, going faster, or doing more. It is about rehabilitation, recovery, and what your body needs right now — whether managing a health condition, recovering from cancer treatment, or living with a disability — and building a sustainable programme around that. Sessions are private, one-to-one, and held in a small studio in Worthing where there is no gym floor, no other clients watching, and no comparison to anyone else.
              </p>
              <p className="ds-body" style={{ marginBottom: 28 }}>
                My specialist training in cancer rehabilitation and exercise referral means I am trained to adapt to medical conditions, medication side-effects, fatigue cycles, and variable capacity. I work within your GP&apos;s or specialist&apos;s guidance. I do not guess — I ask, I listen, and I adjust every session based on your body&apos;s actual needs that day.
              </p>
              <CtaButton cta={bookCta} />
            </Reveal>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image src="/images/strength-tasks.jpg" alt="Strength training for health and function" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
        </div>
      </Section>

      {/* Specialist Areas */}
      <Section background="cream" id="specialist-areas">
        <SectionHeading
          eyebrow="Specialist Areas"
          heading="Who I Work With"
          intro="I specialise in working with people who have been underserved by mainstream fitness. If your situation is not listed here, please still get in touch — the answer is almost always yes."
        />
        <SpecialistGrid items={specialistAreas} />
      </Section>

      {/* What I Work On */}
      <Section background="white">
        <div className="ds-split">
          <Reveal y={40} className="ds-split-img">
            <Image src="/images/who-mobility.jpg" alt="Mobility and functional training" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="What I Work On"
              eyebrowColor="teal"
              heading="Recovery and Rehabilitation for Real Life"
              intro="The focus is functional rehabilitation — building strength, mobility, endurance, and capability for real life during and after health conditions. Not aesthetics. Not performance metrics. Real outcomes: returning to activities after cancer treatment, climbing stairs without pain, managing fatigue, walking further, recovering independence, sleeping better, regaining confidence in your own body."
            />
            <div className="ds-featlist">
              {focusCards.map((c) => (
                <div key={c.title} className="ds-feat">
                  <span className="ds-feat-dot" />
                  <div>
                    <div className="ds-feat-t">{c.title}</div>
                    <div className="ds-feat-c">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section background="cream">
        <SectionHeading align="center" eyebrow="The Process" heading="How It Works" />
        <div style={{ marginTop: 48 }}>
          <ProcessFlow steps={steps.map((s) => ({ title: s.title, body: s.desc }))} />
        </div>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <CtaButton cta={bookCta} />
        </div>
      </Section>

      {/* Specialist Pages */}
      <Section background="white">
        <SectionHeading
          align="center"
          eyebrow="Specialist Pages"
          eyebrowColor="teal"
          heading="Condition-Specific Training"
          intro="Each of my specialist areas has a dedicated page with more detail about how I work with specific conditions."
        />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {specialistPages.map((p) => (
            <FeatureCard key={p.href} image={p.image} imageAlt={p.imageAlt} accent="teal" title={p.title} body={p.desc} href={p.href} />
          ))}
        </Reveal>
      </Section>

      {/* Credentials */}
      <Section background="cream">
        <StatStrip
          background="ink"
          stats={[
            { icon: IconAward, value: "L4", label: "Cancer rehab & exercise referral qualified" },
            { icon: IconUsers, value: "1:1", label: "Private one-to-one sessions only" },
            { icon: IconMessageCircle, value: "30 min", label: "Free, no-pressure consultation" },
            { icon: IconClipboardList, value: "Worthing", label: "Private studio, West Sussex" },
          ]}
        />
      </Section>

      {/* Related Articles */}
      <Section background="white">
        <SectionHeading
          align="center"
          eyebrow="Learn More"
          heading="Related Articles"
          intro="Read more about training with health conditions, recovery strategies, and what makes specialist personal training different."
        />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {relatedArticles.map((a) => (
            <FeatureCard key={a.href} icon={a.icon} accent="rose" title={a.title} body={a.desc} href={a.href} />
          ))}
        </Reveal>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <CtaButton cta={{ label: "View All Articles", href: "/blog", variant: "outline", arrow: true }} />
        </div>
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
