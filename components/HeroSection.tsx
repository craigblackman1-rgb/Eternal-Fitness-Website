"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface HeroSectionProps {
  onBookConsultation?: () => void;
}

const HeroSection = ({ onBookConsultation }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[90vh] flex flex-col overflow-hidden">
      <Image
        src="/images/hero-gym.jpg"
        alt="Esther Fair, Level 4 personal trainer at Eternal Fitness Worthing"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-hero-overlay/55 via-hero-overlay/65 to-hero-overlay/75" />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center text-center px-6 pt-24">
        <div className="max-w-3xl">
          <p className="text-rose text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] mb-5">
            Clinical &amp; Adaptive Fitness · Worthing
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] mb-6">
            Rehabilitation and Recovery Training in Worthing for Complex Health Needs
          </h1>
          <p className="text-white/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
            Specialist one-to-one training for cancer rehabilitation, chronic health conditions, post-surgery recovery, mobility limitations, disabilities, and anyone with complex medical needs who has been overlooked by mainstream fitness. Level 4 qualified. GP-referred clients welcome.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onBookConsultation}
              className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-rose/30"
            >
              Book a Free Consultation
            </button>
            <a
              href="#why"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              Find Out How It Works
            </a>
          </div>
        </div>
      </div>

      {/* Social proof bar */}
      <div className="relative z-10 px-6 pb-8 pt-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-white/10 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center shrink-0">
              <span className="text-teal text-xl font-bold">4</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">Level 4 Qualified</p>
              <p className="text-white/60 text-sm leading-relaxed">The highest personal training qualification in the UK — plus exercise referral and cancer rehabilitation.</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg">
            <p className="text-white/80 text-sm italic mb-2">
              &ldquo;As someone who has dealt with chronic pain for years, I was sceptical. But the personalised approach has genuinely changed my quality of life.&rdquo;
            </p>
            <p className="text-white font-semibold text-sm">Angela M · <span className="text-white/50">Worthing client</span></p>
          </div>
          <div className="bg-rose rounded-2xl p-5 flex flex-col justify-center shadow-lg">
            <h4 className="text-white text-base font-semibold mb-1">Free Consultation</h4>
            <p className="text-white/80 text-sm leading-relaxed">Every new client starts with a free 30-minute conversation with me. No commitment, no sales pitch.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
