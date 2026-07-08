"use client";

import Link from "next/link";
import Image from "next/image";
import { IconArrowUpRight, IconCheck, IconHeart, IconDumbbell, IconTarget } from "@/components/icons";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import {
  Section,
  SectionHeading,
  PageHero,
  Callout,
  StatBadge,
  CTABand,
  Reveal,
} from "@/components/ds";

export default function PricingPageClient({ content = {} }: { content?: Record<string, string> }) {
  const { open, setOpen, openDialog } = useConsultationDialog();

  const valueProps = [
    {
      icon: IconHeart,
      title: content.vp_1_title ?? "One person. One trainer. One focus.",
      description:
        content.vp_1_desc ?? "Your health is not a short-term purchase — it is a long-term investment in your energy, confidence, and overall quality of life. Prioritising wellness now pays dividends for years to come.",
      accent: "rose" as const,
    },
    {
      icon: IconDumbbell,
      title: content.vp_2_title ?? "Qualified to work where others cannot",
      description:
        content.vp_2_desc ?? "My pricing reflects personalised coaching focused on real, sustainable change — not quick fixes. You are paying for private sessions, tailored programmes, and expert guidance designed around your goals.",
      accent: "teal" as const,
    },
    {
      icon: IconTarget,
      title: content.vp_3_title ?? "The first conversation is always free",
      description:
        content.vp_3_desc ?? "Most importantly, you are investing in a process that develops strength, consistency, and lasting habits. After your consultation, I will recommend the right level of support to help you progress safely and effectively.",
      accent: "rose" as const,
    },
  ];

  const plans = [
    {
      name: content.plan_1_name ?? "Single Session",
      price: "£45",
      per: "per session",
      popular: false,
      description: content.plan_1_desc ?? "Pay as you go. Ideal if you want to try a session before committing to a block.",
      features: [
        content.plan_1_feat_1 ?? "60-minute one-to-one session",
        content.plan_1_feat_2 ?? "Programme adapted to your needs",
        content.plan_1_feat_3 ?? "Private studio in Worthing",
        content.plan_1_feat_4 ?? "Full health and mobility assessment on first visit",
      ],
      cta: content.plan_1_cta ?? "Book a Free Consultation First",
    },
    {
      name: content.plan_2_name ?? "Block of 12",
      price: "£480",
      per: "£40 per session",
      popular: true,
      description: content.plan_2_desc ?? "The most popular choice. Enough sessions to build real momentum and see meaningful change.",
      features: [
        content.plan_2_feat_1 ?? "12 x 60-minute sessions",
        content.plan_2_feat_2 ?? "Save £5 per session vs pay-as-you-go",
        content.plan_2_feat_3 ?? "Programme review and adjustment included",
        content.plan_2_feat_4 ?? "Private studio in Worthing",
        content.plan_2_feat_5 ?? "Sessions used at your pace — no expiry pressure",
      ],
      cta: content.plan_2_cta ?? "Book a Free Consultation",
    },
    {
      name: content.plan_3_name ?? "Block of 24",
      price: "£840",
      per: "£35 per session",
      popular: false,
      description: content.plan_3_desc ?? "Best value. For clients committed to long-term progress with complex or ongoing health needs.",
      features: [
        content.plan_3_feat_1 ?? "24 x 60-minute sessions",
        content.plan_3_feat_2 ?? "Save £10 per session vs pay-as-you-go",
        content.plan_3_feat_3 ?? "Ongoing programme management",
        content.plan_3_feat_4 ?? "Priority scheduling",
        content.plan_3_feat_5 ?? "Private studio in Worthing",
      ],
      cta: content.plan_3_cta ?? "Book a Free Consultation",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      <PageHero
        image="/images/pricing-hero.jpg"
        imageAlt="Personal training pricing Worthing"
        eyebrow={content.hero_eyebrow ?? "Pricing"}
        heading={content.hero_heading ?? "Straightforward pricing. No contracts. No surprises."}
        subhead={content.hero_subhead ?? "My pricing reflects premium 1:1 support, tailored programming, and accountability that helps you build long-term results. I start with a free consultation so you only invest in what you actually need."}
        primaryCta={{ label: content.hero_btn_primary ?? "Book a Free Consultation", onClick: openDialog, arrow: true }}
        secondaryCta={{ label: content.hero_btn_secondary ?? "See Pricing", href: "#pricing", variant: "ghost-white" }}
        badge={<StatBadge value="1:1" label={content.badge_label ?? "Private Training"} sublabel={content.badge_sublabel ?? "60-minute sessions in Worthing"} />}
      />

      {/* What You Are Investing In */}
      <Section background="white">
        <div className="ds-split">
          <div>
            <SectionHeading eyebrow={content.value_eyebrow ?? "What You Are Investing In"} heading={content.value_heading ?? "This is not a gym membership"} />
            <Reveal y={24}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                {valueProps.map((prop) => (
                  <Callout key={prop.title} icon={prop.icon} accent={prop.accent} title={prop.title} body={prop.description} />
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal y={40} className="ds-split-img" >
            <Image src="/images/pricing-value.jpg" alt="One-to-one personal training session Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
        </div>
      </Section>

      {/* Pricing Cards */}
      <Section background="cream" id="pricing">
        <SectionHeading
          eyebrow={content.pricing_eyebrow ?? "Pricing"}
          heading={content.pricing_heading ?? "Choose what works for you"}
          intro={content.pricing_intro ?? "All sessions are 60 minutes, one-to-one, in a private studio in Worthing."}
        />
        <Reveal className="ds-grid-3" stagger={0.13} y={48} start="top 82%">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="ds-card"
              style={{ display: "flex", flexDirection: "column", position: "relative", ...(plan.popular ? { border: "2px solid var(--color-rose)" } : {}) }}
            >
              {plan.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "var(--color-rose)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
                  {content.plan_2_popular ?? "Most Popular"}
                </span>
              )}
              <div style={{ marginBottom: 12 }}>
                <p className="ds-card-body" style={{ marginBottom: 8 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "var(--color-ink)", letterSpacing: "-0.02em" }}>{plan.price}</span>
                </div>
                <p className="ds-card-body">{plan.per}</p>
              </div>
              <p className="ds-card-body" style={{ marginBottom: 24 }}>{plan.description}</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                {plan.features.map((feature) => (
                  <li key={feature} className="ds-card-body" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <IconCheck className="w-4 h-4" style={{ color: plan.popular ? "var(--color-teal)" : "var(--color-rose)", flexShrink: 0, marginTop: 2 }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={openDialog} className={`ef-btn justify-center w-full ${plan.popular ? "ef-btn-primary" : "ef-btn-outline"}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </Reveal>

        <div className="ds-callout" style={{ marginTop: 32, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          <div className="ds-callout-ic ds-callout-ic-rose">
            <IconHeart className="w-5 h-5" />
          </div>
          <div>
            <p style={{ fontSize: 14.5, color: "var(--color-body)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-ink)" }}>{content.pricing_note_bold ?? "Not sure which to choose?"}</strong>{content.pricing_note_body ?? " Start with the free consultation. I will give you an honest recommendation based on your situation — not the most expensive option."}
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 14 }}>
              <Link href="/personal-training" style={{ color: "var(--color-rose)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{content.pricing_link_areas ?? "See my specialist areas"} <IconArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/faqs" style={{ color: "var(--color-rose)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{content.pricing_link_faqs ?? "Read the FAQs"} <IconArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </Section>

      <FAQSection />

      <CTABand
        image="/images/studio-1.jpg"
        heading={content.cta_heading ?? "Ready to find out if this is right for you?"}
        body={content.cta_body ?? "The first conversation is free, with no commitment. I work with a small number of clients at a time — so every person gets my full attention."}
        primaryCta={{ label: content.cta_btn_primary ?? "Book a Free Consultation", onClick: openDialog }}
        secondaryCta={{ label: content.cta_btn_secondary ?? "Call: 07517 658 128", href: "tel:07517658128", variant: "ghost-white" }}
      />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
