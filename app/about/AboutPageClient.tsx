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
  FeatureBand,
  AccreditationStrip,
  StatBadge,
  Callout,
  CTABand,
  Reveal,
  CtaButton,
  ProcessFlow,
  PulseLine,
  JourneyPath,
} from "@/components/ds";
import { IconAccessibility, IconDumbbell, IconLeaf, IconHeartHandshake, IconUsers } from "@/components/icons";

export default function AboutPageClient({ content = {} }: { content?: Record<string, string> }) {
  const { open, setOpen, openDialog } = useConsultationDialog();

  const qualifications = [
    { title: content?.qual_1_title ?? "Level 4 Personal Trainer", desc: content?.qual_1_desc ?? "The highest level of personal training qualification in the UK — above the Level 3 held by most personal trainers. Registered with a recognised UK fitness body." },
    { title: content?.qual_2_title ?? "Exercise Referral Specialist", desc: content?.qual_2_desc ?? "Qualified to work with GP-referred clients and those with clinical conditions requiring adapted exercise programmes." },
    { title: content?.qual_3_title ?? "Cancer Rehabilitation", desc: content?.qual_3_desc ?? "Specialist training to support people through cancer treatment and recovery, including those currently in active treatment." },
  ];

  const studioCards = [
    { title: content?.studio_card_1_title ?? "Designed for All Abilities", desc: content?.studio_card_1_desc ?? "Studio set up for disabilities, mobility limitations, and complex health needs — with equipment chosen for functional recovery, not performance aesthetics.", icon: IconAccessibility },
    { title: content?.studio_card_2_title ?? "Equipment That Serves You", desc: content?.studio_card_2_desc ?? "Every piece is chosen to support rehabilitation, recovery, and real-life movement. Resistance bands, mobility tools, and adaptive kit — nothing intimidating.", icon: IconDumbbell },
    { title: content?.studio_card_3_title ?? "A Calm Environment", desc: content?.studio_card_3_desc ?? "No gym floor, no other clients watching, no ambient pressure. Quiet, private, one-to-one sessions — because recovery needs calm, not noise.", icon: IconLeaf },
  ];

  const longTermCards = [
    { title: content?.long_card_1_title ?? "The Power of Consistency", desc: content?.long_card_1_desc ?? "Small, steady actions repeated over time create lasting physical and mental change — without extremes.", image: "/images/approach-consistency.jpg", href: undefined },
    { title: content?.long_card_2_title ?? "Adapting When Things Change", desc: content?.long_card_2_desc ?? "Life and health are unpredictable. Your programme adapts with you, so progress never stops — it just looks different.", image: "/images/mobility-movement.jpg", href: undefined },
    { title: content?.long_card_3_title ?? "Real Outcomes, Not Aesthetics", desc: content?.long_card_3_desc ?? "Stronger, more capable, more comfortable in your body. These are the results that actually matter.", image: "/images/mind-body.jpg", href: undefined },
  ];

  const bookCta = { label: content?.hero_btn_primary ?? "Book a Free Consultation", onClick: openDialog, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/about-hero.jpg"
        imageAlt="Esther Fair, Level 4 personal trainer in Worthing"
        eyebrow={content?.hero_eyebrow ?? "About Esther"}
        heading={content?.hero_heading ?? "About Esther Fair — Cancer Rehabilitation Specialist"}
        subhead={content?.hero_subhead ?? "Level 4 Personal Trainer. Cancer Rehabilitation Specialist. Exercise Referral Specialist. I know first-hand what it feels like to start from zero."}
        primaryCta={bookCta}
        secondaryCta={{ label: content?.hero_btn_secondary ?? "My Story", href: "#story", variant: "ghost-white" }}
        badge={<StatBadge value="L4" label={content?.badge_label ?? "Level 4 Qualified"} sublabel={content?.badge_sublabel ?? "Cancer Rehab & Exercise Referral"} />}
      />

      {/* Story */}
      <Section background="white" id="story">
        <div className="ds-split">
          <Reveal y={40} className="ds-split-img" >
            <Image src="/images/esther-about.jpg" alt="Esther Fair, personal trainer at Eternal Fitness Worthing" fill sizes="(max-width: 1000px) 100vw, 45vw" style={{ objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 3 }}>
              <StatBadge variant="rose" value="L4" label="Qualified" />
            </div>
            <div className="ds-art-chip">
              <JourneyPath accent="rose" milestones={3} />
            </div>
          </Reveal>
          <div>
            <SectionHeading eyebrow={content?.story_eyebrow ?? "My Story"} heading={content?.story_heading ?? "I Have Been Where You Are"} />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>{content?.story_p1 ?? "I did not come to fitness from a place of confidence. There was a time when exercise felt inaccessible, intimidating, and simply not something that was meant for me. When that changed, it changed everything — my health, my recovery, my sense of what my body was capable of."}</p>
              <p className="ds-body" style={{ marginBottom: 16 }}>{content?.story_p2 ?? "That experience is the reason I became a personal trainer. Not to help people lose weight or achieve an aesthetic ideal — but to help people rehabilitate, recover, and feel stronger, more capable, and more functional in their own bodies, regardless of their health conditions or limitations."}</p>
              <p className="ds-body" style={{ marginBottom: 28 }}>{content?.story_p3 ?? "I qualified to Level 4 — the highest personal training qualification in the UK — and went further with specialist certifications in Cancer Rehabilitation and Exercise Referral. I specifically sought these qualifications to work with people who have more complex medical needs: cancer treatment survivors, those with chronic health conditions, post-surgical recovery, disabilities, and clients whose health situations have led other trainers to say they cannot help. Those are exactly the clients I am here for."}</p>
              <CtaButton cta={bookCta} />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Qualifications */}
      <Section background="cream">
        <div className="ds-split">
          <div>
            <SectionHeading
              eyebrow={content?.quals_eyebrow ?? "Qualifications"}
              heading={content?.quals_heading ?? "Qualified to Help Where Others Cannot"}
              intro={content?.quals_intro ?? "Most personal trainers hold a Level 3 qualification. I hold Level 4 — alongside specialist certifications that are rare in any fitness setting."}
            />
            <div className="ds-featlist">
              {qualifications.map((q) => (
                <div key={q.title} className="ds-feat">
                  <span className="ds-feat-dot" />
                  <div>
                    <div className="ds-feat-t">{q.title}</div>
                    <div className="ds-feat-c">{q.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image src="/images/esther-training.jpg" alt="Esther Fair, personal trainer at Eternal Fitness Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
        </div>
        <Reveal y={24} start="top 88%" style={{ marginTop: 56 }}>
          <AccreditationStrip />
        </Reveal>
      </Section>

      {/* Experience */}
      <Section background="white">
        <SectionHeading
          align="center"
          eyebrow={content?.exp_eyebrow ?? "Experience"}
          eyebrowColor="teal"
          heading={content?.exp_heading ?? "Experience Across the Full Range of Human Complexity"}
        />
        <Reveal y={24} className="ds-head-center" >
          <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>{content?.exp_p1 ?? "Over the years, I have worked with clients that most personal trainers would not know how to support — cancer treatment survivors and people in recovery, people managing serious chronic health conditions (fibromyalgia, ME/CFS, autoimmune diseases, heart conditions), people in post-surgical or post-fracture rehabilitation, people with physical disabilities and mobility limitations, clients with significant visual impairment, people with neurological conditions (Parkinson's, MS, stroke recovery), and anyone whose health situation doesn't fit into mainstream fitness templates."}</p>
          <p className="ds-body">{content?.exp_p2 ?? "I mention this not to boast, but because you might be wondering whether your situation is too complicated, too medically complex, or too much. It almost certainly is not. My Cancer Rehabilitation and Exercise Referral certifications equip me to work alongside your GP, specialist, and healthcare team. Every programme is built from scratch — with complete medical awareness and respect for whatever your body, health conditions, recovery status, or history looks like."}</p>
        </Reveal>
        <div style={{ maxWidth: 640, margin: "40px auto 0" }}>
          <Callout
            icon={IconUsers}
            accent="teal"
            title={content?.exp_callout_title ?? "Not sure if you qualify?"}
            body={<>If you are wondering whether your medical situation, cancer recovery, disability, or complex needs mean you cannot train — <Link href="/contact" className="text-teal hover:underline">please get in touch</Link>. The answer is almost always yes, I can help. That is exactly what I <Link href="/personal-training" className="text-teal hover:underline">specialise in</Link>.</>}
          />
        </div>
      </Section>

      {/* Philosophy */}
      <Section background="cream" id="philosophy">
        <div className="ds-split">
          <div>
            <SectionHeading eyebrow={content?.phil_eyebrow ?? "Philosophy"} heading={content?.phil_heading ?? "The Philosophy"} />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>{content?.phil_p1 ?? "Eternal Fitness is not a weight loss service. It is not about transforming your body into something it is not. It is about rehabilitation and recovery — finding out what your body is capable of right now, with all the health conditions, medications, limitations, and recovery status it is currently dealing with — and building steadily from there."}</p>
              <p className="ds-body" style={{ marginBottom: 28 }}>{content?.phil_p2 ?? "The goal is not a six-week result. It is returning to activities after cancer treatment. Being able to move with less pain. Having better fatigue management. Managing your chronic condition without fear. Recovering full function after injury. Climbing stairs. Walking further. Moving through life with more ease, capability, and confidence than before. That takes time, consistency, and working with someone who genuinely understands medical complexity and adjusts when your health or capacity changes. That is what I do."}</p>
              <Callout
                icon={IconHeartHandshake}
                accent="rose"
                title={content?.phil_callout_title ?? "More Than a Workout"}
                body={content?.phil_callout_body ?? "No weigh-ins. No before-and-after photos. No pressure to look a certain way. Just steady, meaningful progress — measured against your own baseline, not anyone else's."}
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
          eyebrow={content?.studio_eyebrow ?? "Studio"}
          heading={content?.studio_heading ?? "A Private Space in Worthing"}
          intro={content?.studio_intro ?? "Sessions take place in a small, private, fully equipped studio. No public gym floor. No other clients watching. No ambient pressure of what anyone else around you is doing."}
        />
        <Reveal className="ds-grid-2" stagger={0.12} y={40} start="top 82%" >
          <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
            <Image src="/images/studio/studio-rack.jpg" alt="The real Eternal Fitness studio in Worthing — squat rack, free weights, and mirror wall" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <div className="ds-split-img" style={{ aspectRatio: "16/10" }}>
            <Image src="/images/studio/studio-neon.jpg" alt="Inside the Eternal Fitness studio — Consistency is Key" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
        </Reveal>
        <Reveal y={40} start="top 82%" style={{ marginTop: 48 }}>
          <FeatureBand
            accent="teal"
            items={studioCards.map((c) => ({ icon: c.icon, title: c.title, body: c.desc }))}
          />
        </Reveal>
      </Section>

      {/* Long-Term */}
      <Section background="cream">
        <SectionHeading
          eyebrow={content?.long_eyebrow ?? "Long-Term Progress"}
          eyebrowColor="teal"
          heading={content?.long_heading ?? "Why the Long-Term Approach Matters"}
          intro={content?.long_intro ?? "Quick fixes do not work. Sustainable change does — and Eternal Fitness is built around that belief."}
        />
        <div className="ds-art-divider"><PulseLine accent="teal" /></div>
        <div style={{ marginTop: 48 }}>
          <ProcessFlow steps={longTermCards.map((c) => ({ title: c.title, body: c.desc }))} />
        </div>
      </Section>

      <CTABand
        image="/images/studio-1.jpg"
        heading={content?.cta_heading ?? "Ready to find out if this is right for you?"}
        body={content?.cta_body ?? "The first conversation is free, with no commitment. I work with a small number of clients at a time — so every person gets my full attention."}
        primaryCta={{ label: content?.cta_btn_primary ?? "Book a Free Consultation", onClick: openDialog }}
        secondaryCta={{ label: content?.cta_btn_secondary ?? "Call: 07517 658 128", href: "tel:07517658128", variant: "ghost-white" }}
      />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
