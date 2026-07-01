"use client";

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
  Callout,
  Reveal,
  CtaButton,
} from "@/components/ds";
import { IconRibbon, IconActivity, IconAlertCircle, IconBone, IconClipboardCheck, IconHeartHandshake } from "@/components/icons";

const stages = [
  {
    title: "During active treatment",
    body: "Chemotherapy and radiotherapy significantly affect energy, immune function, and physical capacity — and those effects are unpredictable from week to week. Sessions during active treatment are lower intensity, shorter, and built around your current treatment schedule. Every session begins with a check-in.",
    icon: IconActivity,
  },
  {
    title: "In remission",
    body: "Remission brings its own challenges — rebuilding fitness that has been lost, managing ongoing fatigue or side effects, and navigating the physical and emotional after-effects of treatment. Sessions progress gradually, respecting the timeline your body needs.",
    icon: IconHeartHandshake,
  },
  {
    title: "Post-surgery",
    body: "Whether mastectomy, colostomy, lymph node removal, or another procedure — post-surgical return to exercise requires careful, staged progression. I work within the guidance of your surgical team and will not progress any movement without appropriate medical clearance.",
    icon: IconClipboardCheck,
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
    title: "Is it safe to exercise during cancer treatment?",
    body: "Evidence now strongly supports exercise during cancer treatment — at the right intensity and with the right guidance. The programme must account for your specific treatment, side effects, and current capacity. I will always ask for GP or oncologist sign-off before beginning.",
    icon: IconClipboardCheck,
  },
  {
    title: "What is cancer-related fatigue and how do you account for it?",
    body: "Cancer-related fatigue (CRF) is physiologically different from ordinary tiredness — it does not improve with rest in the same way. I am trained to recognise CRF and programme around it. Sessions may be shorter or lower in intensity on harder days. That is not failure — it is appropriate clinical management.",
    icon: IconActivity,
  },
  {
    title: "When can I start exercising after surgery?",
    body: "This depends entirely on the type of surgery and your recovery. I work with the guidance of your surgical team and will not progress any movement without appropriate medical clearance.",
    icon: IconHeartHandshake,
  },
  {
    title: "Do you work with people during active treatment?",
    body: "Yes. I work with people during active chemotherapy or radiotherapy, people in remission, and those who have finished treatment but are rebuilding. Each stage requires a different approach — the programme is built around where you are right now.",
    icon: IconClipboardCheck,
  },
];

export default function CancerRehabClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const bookCta = { label: "Book a Free Consultation", onClick: openDialog, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/esther-training.jpg"
        imageAlt="Esther Fair — Cancer Rehabilitation Specialist in Worthing"
        eyebrow="Cancer Rehabilitation"
        heading={<>Personal Training for<br />Cancer Rehabilitation</>}
        subhead="Specialist one-to-one support during treatment, in remission, and post-surgery. Exercise is now strongly evidenced as beneficial throughout the cancer journey — with the right guidance, at the right intensity, from someone qualified to provide it."
        primaryCta={bookCta}
        secondaryCta={{ label: "See Pricing", href: "/pricing", variant: "ghost-white" }}
        badge={<StatBadge variant="rose" value="L4" label="Cancer Rehab Specialist" />}
      />

      {/* THE EVIDENCE */}
      <Section background="white">
        <div className="ds-split">
          <div>
            <SectionHeading
              eyebrow="The Evidence"
              eyebrowColor="teal"
              heading="Why exercise matters during the cancer journey"
            />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>
                Exercise during and after cancer treatment is no longer considered risky — the evidence now
                strongly supports it. Research shows that appropriate exercise during chemotherapy is associated
                with reduced fatigue, better mood, improved immune function, and faster recovery.
              </p>
              <p className="ds-body" style={{ marginBottom: 16 }}>
                After treatment, structured exercise has been shown to improve overall survival rates in some
                cancer types, reduce the risk of recurrence, and significantly improve quality of life.
              </p>
              <p className="ds-body" style={{ marginBottom: 28 }}>
                The qualifier is &ldquo;appropriate.&rdquo; The intensity, type of exercise, and how it adapts to
                treatment side effects matters enormously — and that is where specialist training is essential.
              </p>
              <Callout
                icon={IconRibbon}
                accent="rose"
                title="Cancer Rehabilitation Specialist qualification"
                body="Trained at Level 4 to work with people during and after cancer treatment. This is a specialist qualification, not standard personal training."
              />
              <div style={{ marginTop: 28 }}>
                <CtaButton cta={bookCta} />
              </div>
            </Reveal>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image
              src="/images/esther-about.jpg"
              alt="Esther Fair — Cancer Rehabilitation Specialist in Worthing"
              fill
              sizes="(max-width: 1000px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </Reveal>
        </div>
      </Section>

      {/* STAGES */}
      <Section background="cream">
        <SectionHeading eyebrow="When I Can Help" heading="Support at Every Stage" />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 80%">
          {stages.map((s) => (
            <FeatureCard key={s.title} icon={s.icon} accent="rose" title={s.title} body={s.body} />
          ))}
        </Reveal>
      </Section>

      {/* CLINICAL CONSIDERATIONS */}
      <Section background="white">
        <SectionHeading eyebrow="Clinical Considerations" eyebrowColor="teal" heading="What I Know and How I Work" />
        <Reveal className="ds-grid-2" stagger={0.12} y={48} start="top 80%">
          {considerations.map((c) => (
            <FeatureCard key={c.title} icon={c.icon} accent="teal" title={c.title} body={c.body} />
          ))}
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section background="cream">
        <SectionHeading eyebrow="Questions" heading="Common Questions About Cancer Rehabilitation" />
        <Reveal className="ds-grid-2" stagger={0.12} y={48} start="top 80%">
          {faqs.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} accent="rose" title={f.title} body={f.body} />
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
