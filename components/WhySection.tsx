import Image from "next/image";

const cards = [
  {
    title: "Specialist in complex health conditions",
    image: "/images/mobility-movement.jpg",
    alt: "Personal training for complex health conditions in Worthing",
  },
  {
    title: "Strength and mobility for real life",
    image: "/images/strength-tasks.jpg",
    alt: "Strength and mobility personal training in Worthing",
  },
  {
    title: "Calm, private, one-to-one training",
    image: "/images/mind-body.jpg",
    alt: "Private one-to-one personal training studio Worthing",
  },
];

const WhySection = () => {
  return (
    <section id="why" className="py-20 md:py-28 px-6 md:px-12 bg-off-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
              ✦ Why Eternal Fitness
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground">Training That Meets You Where You Are</h2>
          </div>
          <p className="text-muted-foreground font-body text-base max-w-md md:pt-8">
            Esther Fair is a Level 4 personal trainer, Exercise Referral Specialist, and Cancer Rehabilitation Specialist based in Worthing. She specialises in rehabilitation and recovery training for cancer treatment survivors, chronic health conditions, post-surgery recovery, disabilities, and anyone with complex medical needs who has been overlooked by mainstream fitness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div key={card.title} className="relative rounded-2xl overflow-hidden aspect-[4/5] group shadow-md">
              <Image src={card.image} alt={card.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white text-lg">{card.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
