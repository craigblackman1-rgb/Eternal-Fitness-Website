import { ProcessFlow, StatBlock, IconConsultation, IconAssessment, IconHeartPulse, IconTrending } from "@/components/InfographicSystem";

const processSteps = [
  {
    icon: <IconConsultation />,
    title: "Free Consultation",
    description: "A 30-minute conversation to understand your medical history, goals, and whether we are the right fit. No commitment.",
    color: "teal" as const,
  },
  {
    icon: <IconAssessment />,
    title: "Initial Assessment",
    description: "Full functional movement screening and health review. I build your baseline and design a programme around your body that day.",
    color: "rose" as const,
  },
  {
    icon: <IconHeartPulse />,
    title: "One-to-One Training",
    description: "Private sessions in my Worthing studio. Each session adapts to how you feel — fatigue, pain, and energy levels all factored in.",
    color: "charcoal" as const,
  },
  {
    icon: <IconTrending />,
    title: "Ongoing Support",
    description: "Progress reviews every 6–12 sessions. Programme evolves as your body changes. Same trainer, same studio, consistent care.",
    color: "teal" as const,
  },
];

const stats = [
  { value: "Level 4", label: "Highest PT qualification in the UK — plus cancer rehab and exercise referral", color: "teal" as const },
  { value: "1-to-1", label: "Private studio, no other clients, no gym floor. Every session is just us", color: "rose" as const },
  { value: "100%", label: "Of clients referred by their GP, consultant, or physio continue training long-term", color: "charcoal" as const },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              ✦ How It Works
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground">
              From First Conversation to<br />Lasting Progress
            </h2>
          </div>
          <p className="text-muted-foreground font-body text-base max-w-sm md:pt-8">
            My process is simple by design. No friction, no guesswork, no hidden stages. You know exactly what happens at every step.
          </p>
        </div>

        <ProcessFlow steps={processSteps} />

        <div className="mt-16 md:mt-20 pt-12 md:pt-14 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {stats.map((stat) => (
              <StatBlock key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
