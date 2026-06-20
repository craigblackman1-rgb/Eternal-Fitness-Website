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
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <AnimateIn className="text-center mb-14">
          <p className="text-rose text-xs font-semibold uppercase tracking-widest mb-4">Specialist Areas</p>
          <h2 className="text-3xl md:text-4xl text-foreground mb-3">Who I Work With</h2>
          <p className="text-muted-foreground font-body text-base max-w-2xl mx-auto">
            Cancer rehabilitation (active treatment, in remission, post-surgery). Chronic health conditions (fibromyalgia, ME/CFS, autoimmune, diabetes, heart conditions). Disability and adaptive training. Neurological conditions (Parkinson's, MS, stroke recovery). GP-referred exercise programmes. Post-surgical and injury recovery. Mobility and fatigue management. Complex medical needs. If your situation is not listed — please still get in touch. The answer is almost always yes.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {specialisms.map((item, idx) => (
            <AnimateIn key={item.label} delay={idx * 100} className={item.offset}>
              <div className="relative rounded-xl overflow-hidden group shadow-md aspect-[3/4]">
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
