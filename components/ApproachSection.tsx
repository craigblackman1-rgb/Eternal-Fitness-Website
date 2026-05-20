import Image from "next/image";

const approaches = [
  {
    image: "/images/approach-private.jpg",
    title: "Private 1-to-1 studio",
    subtitle: "No gym floor. No other clients. No pressure to look or perform a certain way.",
  },
  {
    image: "/images/approach-flexible.jpg",
    title: "Adapts when your medical situation changes",
    subtitle: "Fatigue flares. Conditions fluctuate. Side effects vary. Your programme adjusts with your body — always.",
  },
  {
    image: "/images/approach-consistency.jpg",
    title: "Long-term over quick fixes",
    subtitle: "Real results come from steady, sustainable progress — not six-week transformations.",
  },
];

const bottomCards = [
  {
    title: "Qualified in cancer rehabilitation and clinical exercise",
    desc: "Level 4 Personal Trainer, Exercise Referral Specialist, Cancer Rehabilitation Specialist. Trained to work with GP-referred clients, chronic conditions, post-treatment recovery, and complex medical needs — rare qualifications in any fitness setting.",
  },
  {
    title: "No judgement. No agenda.",
    desc: "No weigh-ins, no before-and-after photos, no expectation of what fitness should look like. Just you and me, and a programme built for your body.",
  },
];

const ApproachSection = () => {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
              ✦ The Approach
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground">
              This Is Not Like<br />Other Personal Training
            </h2>
          </div>
          <p className="text-muted-foreground font-body text-base max-w-sm md:pt-8">
            I am a Cancer Rehabilitation Specialist and Exercise Referral Specialist trained to adapt to medical conditions, medication side-effects, fatigue variability, and changing capacity. I work alongside your GP, specialist, or physiotherapist — not against them. Every session is tailored to your body on that day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {approaches.map((item) => (
            <div key={item.title} className="bg-muted rounded-2xl overflow-hidden shadow-md">
              <div className="aspect-[4/3] overflow-hidden relative">
                <Image src={item.image} alt={item.title} fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <h4 className="text-foreground text-lg mb-1">{item.title}</h4>
                <p className="text-muted-foreground text-base">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {bottomCards.map((card) => (
            <div key={card.title} className="bg-muted rounded-2xl p-6 shadow-md">
              <h4 className="text-foreground text-lg mb-2">{card.title}</h4>
              <p className="text-muted-foreground text-base">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
