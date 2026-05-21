"use client";

import Link from "next/link";
import { ArrowUpRight, Award, HeartHandshake, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";

const qualifications = [
  { title: "Level 4 Personal Trainer", desc: "The highest level of personal training qualification in the UK — above the Level 3 held by most personal trainers. Registered with a recognised UK fitness body.", icon: Award },
  { title: "Exercise Referral Specialist", desc: "Qualified to work with GP-referred clients and those with clinical conditions requiring adapted exercise programmes.", icon: HeartHandshake },
  { title: "Cancer Rehabilitation", desc: "Specialist training to support people through cancer treatment and recovery, including those currently in active treatment.", icon: Award },
];

const longTermCards = [
  { title: "The Power of Consistency", desc: "Small, steady actions repeated over time create lasting physical and mental change — without extremes.", image: "/images/approach-consistency.jpg" },
  { title: "Adapting When Things Change", desc: "Life and health are unpredictable. Your programme adapts with you, so progress never stops — it just looks different.", image: "/images/mobility-movement.jpg" },
  { title: "Real Outcomes, Not Aesthetics", desc: "Stronger, more capable, more comfortable in your body. These are the results that actually matter.", image: "/images/mind-body.jpg" },
];

export default function AboutPageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img src="/images/about-hero.jpg" alt="Esther Fair, Level 4 personal trainer in Worthing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/65" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-5">About Esther Fair — Cancer Rehabilitation Specialist</h1>
          <p className="text-primary-foreground/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">Level 4 Personal Trainer. Cancer Rehabilitation Specialist. Exercise Referral Specialist. Specialist in rehabilitation and recovery training for complex health needs. I know first-hand what it feels like to start from zero.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={openDialog} className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">Book a Free Consultation</button>
            <a href="#story" className="inline-flex items-center gap-2 border border-primary-foreground/40 text-primary-foreground px-7 py-3 rounded-full font-medium hover:bg-primary-foreground/10 transition-colors">My Story</a>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6"><span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold">✦ My Story</span></div>
          <h2 className="text-3xl md:text-4xl text-foreground text-center mb-14">I Have Been Where You Are</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-5">I did not come to fitness from a place of confidence. There was a time when exercise felt inaccessible, intimidating, and simply not something that was meant for me. When that changed, it changed everything — my health, my recovery, my sense of what my body was capable of.</p>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-5">That experience is the reason I became a personal trainer. Not to help people lose weight or achieve an aesthetic ideal — but to help people rehabilitate, recover, and feel stronger, more capable, and more functional in their own bodies, regardless of their health conditions or limitations.</p>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-8">I qualified to Level 4 — the highest personal training qualification in the UK — and went further with specialist certifications in Cancer Rehabilitation and Exercise Referral. I specifically sought these qualifications to work with people who have more complex medical needs: cancer treatment survivors, those with chronic health conditions, post-surgical recovery, disabilities, and clients whose health situations have led other trainers to say they cannot help. Those are exactly the clients I am here for.</p>
              <button onClick={openDialog} className="inline-flex items-center gap-2 bg-rose text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">Book a Free Consultation <ArrowUpRight className="w-4 h-4" /></button>
            </div>
            <img src="/images/esther-about.jpg" alt="Esther Fair, personal trainer at Eternal Fitness Worthing" loading="lazy" className="rounded-2xl w-full h-[460px] object-cover" />
          </div>
        </div>
      </section>

      {/* Qualifications */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">✦ Qualifications</span>
            <h2 className="text-3xl md:text-4xl text-foreground mb-4">Qualified to Help Where Others Cannot</h2>
            <p className="text-muted-foreground font-body text-base max-w-2xl mx-auto">Most personal trainers hold a Level 3 qualification. I hold Level 4 — alongside specialist certifications that are rare in any fitness setting.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {qualifications.map((q) => (
              <div key={q.title} className="bg-white rounded-2xl p-6 border border-muted shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose flex items-center justify-center mb-4"><q.icon className="w-5 h-5 text-white" /></div>
                <h4 className="text-foreground text-lg mb-2">{q.title}</h4>
                <p className="text-muted-foreground font-body text-base leading-relaxed">{q.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6"><span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold">✦ Experience</span></div>
          <h2 className="text-3xl md:text-4xl text-foreground text-center mb-6">Experience Across the Full Range of Human Complexity</h2>
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-muted-foreground font-body text-base leading-relaxed mb-5">Over the years, I have worked with clients that most personal trainers would not know how to support — cancer treatment survivors and people in recovery, people managing serious chronic health conditions (fibromyalgia, ME/CFS, autoimmune diseases, heart conditions), people in post-surgical or post-fracture rehabilitation, people with physical disabilities and mobility limitations, clients with significant visual impairment, people with neurological conditions (Parkinson's, MS, stroke recovery), and anyone whose health situation doesn't fit into mainstream fitness templates.</p>
            <p className="text-muted-foreground font-body text-base leading-relaxed">I mention this not to boast, but because you might be wondering whether your situation is too complicated, too medically complex, or too much. It almost certainly is not. My Cancer Rehabilitation and Exercise Referral certifications equip me to work alongside your GP, specialist, and healthcare team. Every programme is built from scratch — with complete medical awareness and respect for whatever your body, health conditions, recovery status, or history looks like.</p>
          </div>
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-rose/10 rounded-2xl px-6 py-4 max-w-xl">
              <Users className="w-5 h-5 text-rose shrink-0" />
              <p className="text-foreground font-body text-base leading-relaxed">If you are wondering whether your medical situation, cancer recovery, disability, or complex needs mean you cannot train — <Link href="/contact" className="text-rose hover:underline">please get in touch</Link>. The answer is almost always yes, I can help. That is exactly what I <Link href="/personal-training" className="text-rose hover:underline">specialise in</Link>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">✦ Philosophy</span>
              <h2 className="text-3xl md:text-4xl text-foreground leading-tight mb-6">The Philosophy</h2>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-5">Eternal Fitness is not a weight loss service. It is not about transforming your body into something it is not. It is about rehabilitation and recovery — finding out what your body is capable of right now, with all the health conditions, medications, limitations, and recovery status it is currently dealing with — and building steadily from there.</p>
              <p className="text-muted-foreground font-body text-base leading-relaxed mb-6">The goal is not a six-week result. It is returning to activities after cancer treatment. Being able to move with less pain. Having better fatigue management. Managing your chronic condition without fear. Recovering full function after injury. Climbing stairs. Walking further. Moving through life with more ease, capability, and confidence than before. That takes time, consistency, and working with someone who genuinely understands medical complexity and adjusts when your health or capacity changes. That is what I do.</p>
              <div className="bg-white rounded-2xl p-5 mb-6 border border-muted shadow-sm">
                <h4 className="text-foreground mb-2">More Than a Workout</h4>
                <p className="text-muted-foreground font-body text-base leading-relaxed">No weigh-ins. No before-and-after photos. No pressure to look a certain way. Just steady, meaningful progress — measured against your own baseline, not anyone else&apos;s.</p>
              </div>
              <button onClick={openDialog} className="inline-flex items-center gap-2 bg-rose text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">Book a Free Consultation <ArrowUpRight className="w-4 h-4" /></button>
            </div>
            <img src="/images/about-philosophy.jpg" alt="Personal training philosophy at Eternal Fitness Worthing" loading="lazy" className="rounded-2xl w-full h-[420px] object-cover" />
          </div>
        </div>
      </section>

      {/* Studio */}
      <section className="py-20 md:py-28 bg-section-dark">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">✦ Studio</span>
            <h2 className="text-3xl md:text-4xl text-primary-foreground mb-4">A Private Space in Worthing</h2>
            <p className="text-primary-foreground/70 font-body text-base max-w-2xl mx-auto">Sessions take place in a small, private, fully equipped studio. No public gym floor. No other clients watching. No ambient pressure of what anyone else around you is doing.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <img src="/images/studio-1.jpg" alt="Eternal Fitness private training studio Worthing" loading="lazy" className="rounded-2xl w-full h-72 object-cover" />
            <img src="/images/studio-2.jpg" alt="Training equipment at Eternal Fitness Worthing" loading="lazy" className="rounded-2xl w-full h-72 object-cover" />
          </div>
          <div className="bg-background/5 border border-primary-foreground/10 rounded-2xl p-6 md:p-8 max-w-2xl shadow-md">
            <h4 className="text-primary-foreground text-lg mb-2">Built for All Abilities</h4>
            <p className="text-primary-foreground/80 font-body text-base leading-relaxed">The studio is set up specifically for people with disabilities, mobility limitations, and complex health needs. Equipment is chosen to support functional recovery and movement — not performance aesthetics. The environment is deliberately calm, because the last thing someone managing a health condition or in recovery needs is more pressure or noise.</p>
          </div>
        </div>
      </section>

      {/* Long-Term */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6">
            <div>
              <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">✦ Long-Term Progress</span>
              <h2 className="text-3xl md:text-4xl text-foreground">Why the Long-Term Approach Matters</h2>
            </div>
            <p className="text-muted-foreground font-body text-base max-w-md">Quick fixes do not work. Sustainable change does — and Eternal Fitness is built around that belief.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {longTermCards.map((card) => (
              <div key={card.title} className="border border-muted rounded-2xl overflow-hidden">
                <div className="h-48 overflow-hidden"><img src={card.image} alt={card.title} loading="lazy" className="w-full h-full object-cover" /></div>
                <div className="p-5">
                  <h4 className="text-foreground text-lg mb-2">{card.title}</h4>
                  <p className="text-muted-foreground font-body text-base">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
