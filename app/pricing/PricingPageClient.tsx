"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Heart, Dumbbell, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";

const plans = [
  {
    name: "Single Session",
    price: "£45",
    per: "per session",
    popular: false,
    description: "Pay as you go. Ideal if you want to try a session before committing to a block.",
    features: [
      "60-minute one-to-one session",
      "Programme adapted to your needs",
      "Private studio in Worthing",
      "Full health and mobility assessment on first visit",
    ],
    cta: "Book a Free Consultation First",
  },
  {
    name: "Block of 12",
    price: "£480",
    per: "£40 per session",
    popular: true,
    description: "The most popular choice. Enough sessions to build real momentum and see meaningful change.",
    features: [
      "12 x 60-minute sessions",
      "Save £5 per session vs pay-as-you-go",
      "Programme review and adjustment included",
      "Private studio in Worthing",
      "Sessions used at your pace — no expiry pressure",
    ],
    cta: "Book a Free Consultation",
  },
  {
    name: "Block of 24",
    price: "£840",
    per: "£35 per session",
    popular: false,
    description: "Best value. For clients committed to long-term progress with complex or ongoing health needs.",
    features: [
      "24 x 60-minute sessions",
      "Save £10 per session vs pay-as-you-go",
      "Ongoing programme management",
      "Priority scheduling",
      "Private studio in Worthing",
    ],
    cta: "Book a Free Consultation",
  },
];

const valueProps = [
  {
    icon: Heart,
    title: "One person. One trainer. One focus.",
    description:
      "Your health is not a short-term purchase — it is a long-term investment in your energy, confidence, and overall quality of life. Prioritising wellness now pays dividends for years to come.",
  },
  {
    icon: Dumbbell,
    title: "Qualified to work where others cannot",
    description:
      "My pricing reflects personalised coaching focused on real, sustainable change — not quick fixes. You are paying for private sessions, tailored programmes, and expert guidance designed around your goals.",
  },
  {
    icon: Target,
    title: "The first conversation is always free",
    description:
      "Most importantly, you are investing in a process that develops strength, consistency, and lasting habits. After your consultation, I will recommend the right level of support to help you progress safely and effectively.",
  },
];

export default function PricingPageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* Hero */}
      <section className="relative min-h-[70vh] pt-[72px] flex items-center justify-center overflow-hidden">
        <img src="/images/pricing-hero.jpg" alt="Personal training pricing Worthing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-hero-overlay/55 via-hero-overlay/65 to-hero-overlay/75" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Straightforward pricing. No contracts. No surprises.
          </h1>
          <p className="text-white/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
            My pricing reflects premium 1:1 support, tailored programming, and accountability that helps you build long-term results. I start with a free consultation so you only invest in what you actually need.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-rose/30"
            >
              Book a Free Consultation
            </button>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* What You Are Investing In */}
      <section className="ef-section px-6 md:px-12 bg-background">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <div className="ef-eyebrow ef-eyebrow-rose mb-5">
              What You Are Investing In
            </div>
            <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-10">
              This is not a gym membership
            </h2>
            <div className="space-y-8">
              {valueProps.map((prop, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full ${i === 1 ? 'bg-teal/10' : 'bg-rose/10'} flex items-center justify-center shrink-0`}>
                    <prop.icon className={`w-5 h-5 ${i === 1 ? 'text-teal' : 'text-rose'}`} />
                  </div>
                  <div>
                    <h4 className="text-foreground text-base font-bold tracking-tight mb-1">{prop.title}</h4>
                    <p className="ef-body text-sm">{prop.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden h-[500px] shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
            <img src="/images/pricing-value.jpg" alt="One-to-one personal training session Worthing" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing" className="ef-section px-6 md:px-12 bg-warm">
        <div className="max-w-[1320px] mx-auto">
          <div className="mb-12">
            <div className="ef-eyebrow ef-eyebrow-rose mb-5">
              Pricing
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-2">
                  Choose what works for you
                </h2>
                <p className="ef-body">
                  All sessions are 60 minutes, one-to-one, in a private studio in Worthing.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative ef-card flex flex-col ${
                  plan.popular ? "border-rose border-2 shadow-md" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap tracking-wide">
                    Most Popular
                  </span>
                )}
                <div className="mb-3">
                  <p className="ef-body text-sm mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-display text-foreground font-bold tracking-tight">{plan.price}</span>
                  </div>
                  <p className="ef-body text-sm">{plan.per}</p>
                </div>
                <p className="ef-body text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-body ef-body">
                      <Check className={`w-4 h-4 ${plan.popular ? 'text-teal' : 'text-rose'} shrink-0 mt-0.5`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={openDialog}
                  className={`w-full py-3 rounded-full font-medium text-sm transition-all hover:opacity-90 ${
                    plan.popular
                      ? "bg-rose text-white shadow-sm"
                      : "bg-white text-foreground border border-[#E4DDD7]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 ef-card max-w-2xl">
            <p className="ef-body text-sm">
              <strong className="text-foreground">Not sure which to choose?</strong> Start with the free consultation. I will give you an honest recommendation based on your situation — not the most expensive option.
            </p>
            <p className="ef-body text-sm mt-3">
              <Link href="/personal-training" className="text-rose hover:underline">See my specialist areas</Link> &middot; <Link href="/faqs" className="text-rose hover:underline">Read the FAQs</Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
