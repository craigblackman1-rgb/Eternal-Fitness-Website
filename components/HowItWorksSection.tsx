"use client";

import { AnimateIn } from "@/components/AnimateIn";
import {
  IconConsultation,
  IconAssessment,
  IconHeartPulse,
  IconTrending,
  IconFrame,
} from "@/components/InfographicSystem";

const processSteps = [
  {
    icon: <IconConsultation />,
    step: "01",
    title: "Free Consultation",
    description:
      "A 30-minute conversation to understand your medical history, goals, and whether we are the right fit. No commitment.",
    color: "teal" as const,
  },
  {
    icon: <IconAssessment />,
    step: "02",
    title: "Initial Assessment",
    description:
      "Full functional movement screening and health review. I build your baseline and design a programme around your body that day.",
    color: "rose" as const,
  },
  {
    icon: <IconHeartPulse />,
    step: "03",
    title: "One-to-One Training",
    description:
      "Private sessions in my Worthing studio. Each session adapts to how you feel — fatigue, pain, and energy levels all factored in.",
    color: "teal" as const,
  },
  {
    icon: <IconTrending />,
    step: "04",
    title: "Ongoing Support",
    description:
      "Progress reviews every 6–12 sessions. Programme evolves as your body changes. Same trainer, same studio, consistent care.",
    color: "rose" as const,
  },
];

const stats = [
  {
    value: "Level 4",
    label: "Highest PT qualification in the UK — plus cancer rehab and exercise referral",
    accent: "teal" as const,
  },
  {
    value: "1-to-1",
    label: "Private studio, no other clients, no gym floor. Every session is just us",
    accent: "rose" as const,
  },
  {
    value: "100%",
    label: "Of clients referred by their GP, consultant, or physio continue training long-term",
    accent: "white" as const,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-dark-navy">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <AnimateIn className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
          <div>
            <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-4">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl text-white">
              From First Conversation to<br />Lasting Progress
            </h2>
          </div>
          <p className="text-white/50 font-body text-base max-w-sm md:pb-1">
            My process is simple by design. No friction, no guesswork, no
            hidden stages. You know exactly what happens at every step.
          </p>
        </AnimateIn>

        {/* Process steps — staggered grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {processSteps.map((step, i) => (
            <AnimateIn
              key={step.step}
              delay={i * 90}
              className={i % 2 === 1 ? "lg:mt-14" : ""}
            >
              <div className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 h-full hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-400">

                {/* Ghost step number watermark */}
                <span className="absolute top-3 right-4 text-[88px] leading-none font-bold text-white/[0.04] select-none pointer-events-none tabular-nums">
                  {step.step}
                </span>

                <IconFrame icon={step.icon} color={step.color} size="md" />

                <div className="mt-5 relative">
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
                      step.color === "teal" ? "text-teal" : "text-rose"
                    }`}
                  >
                    Step {step.step}
                  </p>
                  <h4 className="text-white font-semibold text-lg leading-snug mb-3">
                    {step.title}
                  </h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Stats — editorial, left-aligned */}
        <AnimateIn className="mt-16 md:mt-20 pt-12 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <div
                  className={`w-8 h-0.5 mb-4 ${
                    stat.accent === "teal"
                      ? "bg-teal"
                      : stat.accent === "rose"
                      ? "bg-rose"
                      : "bg-white/25"
                  }`}
                />
                <p
                  className={`text-4xl md:text-5xl font-bold tracking-tight leading-none mb-3 ${
                    stat.accent === "teal"
                      ? "text-teal"
                      : stat.accent === "rose"
                      ? "text-rose"
                      : "text-white"
                  }`}
                >
                  {stat.value}
                </p>
                <p className="text-white/40 text-sm leading-relaxed max-w-[220px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
