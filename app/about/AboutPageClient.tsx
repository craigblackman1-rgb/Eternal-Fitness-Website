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
  Callout,
  CTABand,
  Reveal,
  CtaButton,
} from "@/components/ds";
import { IconAward, IconHeartHandshake, IconUsers, IconAccessibility, IconDumbbell, IconLeaf } from "@/components/icons";

const qualifications = [
  { title: "Level 4 Personal Trainer", desc: "The highest level of personal training qualification in the UK — above the Level 3 held by most personal trainers. Registered with a recognised UK fitness body.", icon: IconAward },
  { title: "Exercise Referral Specialist", desc: "Qualified to work with GP-referred clients and those with clinical conditions requiring adapted exercise programmes.", icon: IconHeartHandshake },
  { title: "Cancer Rehabilitation", desc: "Specialist training to support people through cancer treatment and recovery, including those currently in active treatment.", icon: IconAward },
];

const studioCards = [
  { title: "Designed for All Abilities", desc: "Studio set up for disabilities, mobility limitations, and complex health needs — with equipment chosen for functional recovery, not performance aesthetics.", icon: IconAccessibility },
  { title: "Equipment That Serves You", desc: "Every piece is chosen to support rehabilitation, recovery, and real-life movement. Resistance bands, mobility tools, and adaptive kit — nothing intimidating.", icon: IconDumbbell },
  { title: "A Calm Environment", desc: "No gym floor, no other clients watching, no ambient pressure. Quiet, private, one-to-one sessions — because recovery needs calm, not noise.", icon: IconLeaf },
];

const longTermCards = [
  { title: "The Power of Consistency", desc: "Small, steady actions repeated over time create lasting physical and mental change — without extremes.", image: "/images/approach-consistency.jpg", href: undefined },
  { title: "Adapting When Things Change", desc: "Life and health are unpredictable. Your programme adapts with you, so progress never stops — it just looks different.", image: "/images/mobility-movement.jpg", href: undefined },
  { title: "Real Outcomes, Not Aesthetics", desc: "Stronger, more capable, more comfortable in your body. These are the results that actually matter.", image: "/images/mind-body.jpg", href: undefined },
];

export default function AboutPageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const bookCta = { label: "Book a Free Consultation", onClick: openDialog, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/about-hero.jpg"
        imageAlt="Esther Fair, Level 4 personal trainer in Worthing"
        eyebrow="About Esther"
        heading="About Esther Fair — Cancer Rehabilitation Specialist"
        subhead="Level 4 Personal Trainer. Cancer Rehabilitation Specialist. Exercise Referral Specialist. I know first-hand what it feels like to start from zero."
        primaryCta={bookCta}
        secondaryCta={{ label: "My Story", href: "#story", variant: "ghost-white" }}
        badge={<StatBadge value="L4" label="Level 4 Qualified" sublabel="Cancer Rehab & Exercise Referral" />}
      />

      {/* Story */}
      <Section background="white" id="story">
        <div className="ds-split">
          <Reveal y={40} className="ds-split-img" >
            <Image src="/images/esther-about.jpg" alt="Esther Fair, personal trainer at Eternal Fitness Worthing" fill sizes="(max-width: 1000px) 100vw, 45vw" style={{ objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 3 }}>
              <StatBadge variant="rose" value="L4" label="Qualified" />
            </div>
          </Reveal>
          <div>
            <SectionHeading eyebrow="My Story" heading="I Have Been Where You Are" />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>I did not come to fitness from a place of confidence. There was a time when exercise felt inaccessible, intimidating, and simply not something that was meant for me. When that changed, it changed everything — my health, my recovery, my sense of what my body was capable of.</p>
              <p className="ds-body" style={{ marginBottom: 16 }}>That experience is the reason I became a personal trainer. Not to help people lose weight or achieve an aesthetic ideal — but to help people rehabilitate, recover, and feel stronger, more capable, and more functional in their own bodies, regardless of their health conditions or limitations.</p>
              <p className="ds-body" style={{ marginBottom: 28 }}>I qualified to Level 4 — the highest personal training qualification in the UK — and went further with specialist certifications in Cancer Rehabilitation and Exercise Referral. I specifically sought these qualifications to work with people who have more complex medical needs: cancer treatment survivors, those with chronic health conditions, post-surgical recovery, disabilities, and clients whose health situations have led other trainers to say they cannot help. Those are exactly the clients I am here for.</p>
              <CtaButton cta={bookCta} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Qualifications */}
      <Section background="cream">
        <SectionHeading
          align="center"
          eyebrow="Qualifications"
          heading="Qualified to Help Where Others Cannot"
          intro="Most personal trainers hold a Level 3 qualification. I hold Level 4 — alongside specialist certifications that are rare in any fitness setting."
        />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {qualifications.map((q) => (
            <FeatureCard key={q.title} icon={q.icon} accent="teal" title={q.title} body={q.desc} />
          ))}
        </Reveal>
      </Section>

      {/* Experience */}
      <Section background="white">
        <SectionHeading
          align="center"
          eyebrow="Experience"
          eyebrowColor="teal"
          heading="Experience Across the Full Range of Human Complexity"
        />
        <Reveal y={24} className="ds-head-center" >
          <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>Over the years, I have worked with clients that most personal trainers would not know how to support — cancer treatment survivors and people in recovery, people managing serious chronic health conditions (fibromyalgia, ME/CFS, autoimmune diseases, heart conditions), people in post-surgical or post-fracture rehabilitation, people with physical disabilities and mobility limitations, clients with significant visual impairment, people with neurological conditions (Parkinson&apos;s, MS, stroke recovery), and anyone whose health situation doesn&apos;t fit into mainstream fitness templates.</p>
          <p className="ds-body">I mention this not to boast, but because you might be wondering whether your situation is too complicated, too medically complex, or too much. It almost certainly is not. My Cancer Rehabilitation and Exercise Referral certifications equip me to work alongside your GP, specialist, and healthcare team. Every programme is built from scratch — with complete medical awareness and respect for whatever your body, health conditions, recovery status, or history looks like.</p>
        </Reveal>
        <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
          <Callout
            icon={IconUsers}
            accent="teal"
            title="Not sure if you qualify?"
            body={<>If you are wondering whether your medical situation, cancer recovery, disability, or complex needs mean you cannot train — <Link href="/contact" className="text-teal hover:underline">please get in touch</Link>. The answer is almost always yes, I can help. That is exactly what I <Link href="/personal-training" className="text-teal hover:underline">specialise in</Link>.</>}
          />
        </div>
      </Section>

      {/* Philosophy */}
      <Section background="cream" id="philosophy">
        <div className="ds-split">
          <div>
            <SectionHeading eyebrow="Philosophy" heading="The Philosophy" />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>Eternal Fitness is not a weight loss service. It is not about transforming your body into something it is not. It is about rehabilitation and recovery — finding out what your body is capable of right now, with all the health conditions, medications, limitations, and recovery status it is currently dealing with — and building steadily from there.</p>
              <p className="ds-body" style={{ marginBottom: 28 }}>The goal is not a six-week result. It is returning to activities after cancer treatment. Being able to move with less pain. Having better fatigue management. Managing your chronic condition without fear. Recovering full function after injury. Climbing stairs. Walking further. Moving through life with more ease, capability, and confidence than before. That takes time, consistency, and working with someone who genuinely understands medical complexity and adjusts when your health or capacity changes. That is what I do.</p>
              <Callout
                icon={IconHeartHandshake}
                accent="rose"
                title="More Than a Workout"
                body="No weigh-ins. No before-and-after photos. No pressure to look a certain way. Just steady, meaningful progress — measured against your own baseline, not anyone else's."
              />
              <div style={{ marginTop: 28 }}>
                <CtaButton cta={bookCta} />
              </div>
            </Reveal>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image src="/images/about-philosophy.jpg" alt="Personal training philosophy at Eternal Fitness Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
        </div>
      </Section>

      {/* Studio */}
      <Section background="white">
        <SectionHeading
          align="center"
          eyebrow="Studio"
          heading="A Private Space in Worthing"
          intro="Sessions take place in a small, private, fully equipped studio. No public gym floor. No other clients watching. No ambient pressure of what anyone else around you is doing."
        />
        <Reveal className="ds-grid-2" stagger={0.12} y={40} start="top 82%" >
          <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
            <Image src="/images/studio-1.jpg" alt="Eternal Fitness private training studio Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
            <Image src="/images/studio-2.jpg" alt="Training equipment at Eternal Fitness Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
        </Reveal>
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 82%" >
          {studioCards.map((c) => (
            <FeatureCard key={c.title} icon={c.icon} accent="teal" title={c.title} body={c.desc} />
          ))}
        </Reveal>
      </Section>

      {/* Long-Term */}
      <Section background="cream">
        <SectionHeading
          eyebrow="Long-Term Progress"
          eyebrowColor="teal"
          heading="Why the Long-Term Approach Matters"
          intro="Quick fixes do not work. Sustainable change does — and Eternal Fitness is built around that belief."
        />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {longTermCards.map((c) => (
            <FeatureCard key={c.title} image={c.image} imageAlt={c.title} title={c.title} body={c.desc} />
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
