import Image from "next/image";
import { AnimateIn } from "@/components/AnimateIn";

const specialisms = [
  {
    src: "/images/specialise-1.jpg",
    label: "Cancer Rehabilitation",
    desc: "Specialist support during treatment, in remission, and post-surgery.",
    alt: "Cancer rehabilitation personal training Worthing",
    offset: "md:mt-0",
  },
  {
    src: "/images/specialise-2.jpg",
    label: "Adaptive Training",
    desc: "Inclusive programmes tailored to your abilities and goals.",
    alt: "Adaptive personal training for disability Worthing",
    offset: "md:mt-10",
  },
  {
    src: "/images/specialise-3.jpg",
    label: "Injury Recovery",
    desc: "Safe, structured return to movement after injury or surgery.",
    alt: "Injury recovery and rehabilitation personal training Worthing",
    offset: "md:mt-4",
  },
];

const SpecialiseSection = () => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <AnimateIn className="mb-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <p className="text-rose text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] mb-4">Specialist Areas</p>
              <h2 className="text-4xl md:text-5xl text-foreground leading-[1.1]">Who I Work With</h2>
            </div>
            <p className="text-muted-foreground font-body text-base max-w-xs md:pb-1">
              If your situation is not listed — please still get in touch. The answer is almost always yes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {[
              {
                group: "Cancer & Recovery",
                items: ["Cancer rehabilitation", "Active treatment support", "Post-surgery recovery", "Injury rehabilitation"],
              },
              {
                group: "Chronic Conditions",
                items: ["Fibromyalgia & ME/CFS", "Autoimmune conditions", "Type 2 diabetes", "Heart conditions", "COPD", "Long COVID", "Chronic pain"],
              },
              {
                group: "Neurological & Mobility",
                items: ["Parkinson's disease", "Multiple sclerosis", "Stroke recovery", "Mobility & fatigue management"],
              },
              {
                group: "Specialist Support",
                items: ["Disability & adaptive training", "GP-referred exercise", "Post-natal recovery", "Mental health support"],
              },
            ].map((group) => (
              <div key={group.group}>
                <p className="text-sm font-semibold text-rose mb-3">{group.group}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center px-3.5 py-2 rounded-2xl text-sm font-medium bg-white text-foreground border border-border shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {specialisms.map((item, idx) => (
            <AnimateIn key={item.label} delay={idx * 100} className={item.offset}>
              <div className="relative rounded-2xl overflow-hidden group shadow-md aspect-[3/4]">
                <Image src={item.src} alt={item.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white text-lg font-semibold">{item.label}</h3>
                  <p className="text-white/80 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialiseSection;
