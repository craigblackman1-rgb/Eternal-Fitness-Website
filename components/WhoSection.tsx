import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const WhoSection = () => {
  return (
    <section className="py-20 md:py-28 bg-section-dark">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
              ✦ Who This Is For
            </span>
            <h2 className="text-3xl md:text-4xl text-primary-foreground">If You Have Been Told Fitness Is Not for You — It Is</h2>
          </div>
          <p className="text-primary-foreground/70 font-body text-base max-w-sm">
            I have worked with clients managing cancer, chronic illness, disability, visual impairment, neurological conditions, and complex mobility issues. I am here for the people other trainers cannot help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background rounded-2xl overflow-hidden shadow-md">
            <div className="aspect-video overflow-hidden relative">
              <Image src="/images/who-health.jpg" alt="Training with health conditions Worthing" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="p-6">
              <h3 className="text-foreground text-xl mb-2">People managing health conditions, disability, or injury</h3>
              <p className="text-muted-foreground font-body text-base mb-4">
                Cancer rehabilitation. Chronic illness. Neurological conditions. Post-surgical recovery. Extreme mobility limitations. I am Level 4 qualified and exercise referral trained — I know how to work safely and effectively with complex needs.
              </p>
              <a href="/personal-training" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                See Specialist Areas <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-background rounded-2xl overflow-hidden shadow-md">
            <div className="aspect-video overflow-hidden relative">
              <Image src="/images/who-mobility.jpg" alt="Inclusive personal training Worthing" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="p-6">
              <h3 className="text-foreground text-xl mb-2">People who have never felt welcome in fitness spaces</h3>
              <p className="text-muted-foreground font-body text-base">
                Whether you are a complete beginner, have had negative experiences elsewhere, or simply find gyms intimidating — the private, one-to-one format at Eternal Fitness is designed to feel completely different. No dress code, no weigh-in, no comparison to anyone else.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoSection;
