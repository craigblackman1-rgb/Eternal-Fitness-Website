"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList, Search, BarChart3, HeartHandshake } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";

const sessionImages = ["/images/specialise-2.jpg", "/images/specialise-1.jpg"];

const specialistAreas = [
  {
    title: "Cancer & cancer rehabilitation",
    desc: "During active treatment, in remission, or post-surgery. I am qualified in cancer rehabilitation and adapt to wherever you are in your journey.",
  },
  {
    title: "Chronic health conditions",
    desc: "Including autoimmune conditions, fibromyalgia, ME/CFS, heart conditions, diabetes, and more. Every session adapts to what your body can manage that day.",
  },
  {
    title: "Disability & adaptive training",
    desc: "Physical disabilities, significant mobility limitations, and sensory impairments including visual impairment. Programmes are built around your body, not a template.",
  },
  {
    title: "GP-referred exercise",
    desc: "I am qualified in exercise referral and experienced in working alongside medical guidance from GPs and healthcare teams.",
  },
  {
    title: "Injury recovery & rehabilitation",
    desc: "Post-surgical, post-fracture, and musculoskeletal conditions. I work within the guidance of your physiotherapist or consultant.",
  },
  {
    title: "Neurological conditions",
    desc: "Including Parkinson's, MS, stroke recovery, and acquired brain injury. Gentle, progressive, and always adapted.",
  },
];

const focusCards = [
  {
    title: "Mobility and joint health",
    desc: "Improving range of motion, reducing stiffness, and moving with less effort and pain day-to-day.",
  },
  {
    title: "Functional strength",
    desc: "Building practical strength for real life — carrying shopping, climbing stairs, getting up from the floor.",
  },
  {
    title: "Balance and stability",
    desc: "Reducing fall risk and building the physical confidence to move through your environment safely.",
  },
  {
    title: "Fatigue management",
    desc: "Learning how to train effectively when energy levels are variable or unpredictable — a common challenge with many health conditions.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "Free Consultation",
    desc: "A relaxed 30-minute conversation with me about your goals, health history, and what has and has not worked before. No pressure, no commitment.",
  },
  {
    icon: Search,
    title: "Movement Assessment",
    desc: "I check your current mobility, strength, and any limitations before any programme begins — so training starts safely and clearly.",
  },
  {
    icon: BarChart3,
    title: "Your Programme",
    desc: "A plan built entirely around your body and your life. Session structure, exercises, and intensity are all tailored specifically to you.",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing Support",
    desc: "I adjust your programme as your health and capacity change — keeping training sustainable, realistic, and aligned with where you are.",
  },
];

export default function PersonalTrainingClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img src="/images/pt-hero.jpg" alt="Personal training in Worthing for health conditions and complex needs" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/70" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Cancer Rehabilitation and Recovery Training in Worthing
          </h1>
          <p className="text-white/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
            Private one-to-one sessions with a Cancer Rehabilitation Specialist and Exercise Referral Specialist (Level 4 qualified). Whether you are in cancer treatment, post-surgery recovery, managing a chronic condition, living with a disability, or have complex medical needs — there is a specialist programme here for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Book a Free Consultation
            </button>
            <a href="#what" className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
              What Sessions Involve
            </a>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section id="what" className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-6">
            What to Expect
          </span>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl text-foreground leading-tight mb-6">
                This Is Not Like Other Personal Training
              </h2>
              <div className="flex gap-4 mb-6">
                <img src="/images/approach-private.jpg" alt="Private one-to-one training session" loading="lazy" className="w-24 h-32 rounded-xl object-cover shrink-0" />
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  Personal training at Eternal Fitness is not about pushing harder, going faster, or doing more. It is about rehabilitation, recovery, and what your body needs right now — whether managing a health condition, recovering from cancer treatment, or living with a disability — and building a sustainable programme around that. Sessions are private, one-to-one, and held in a small studio in Worthing where there is no gym floor, no other clients watching, and no comparison to anyone else.
                </p>
              </div>
              <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                My specialist training in cancer rehabilitation and exercise referral means I am trained to adapt to medical conditions, medication side-effects, fatigue cycles, and variable capacity. I work within your GP's or specialist's guidance. I do not guess — I ask, I listen, and I adjust every session based on your body's actual needs that day.
              </p>
              <button
                onClick={openDialog}
                className="inline-flex items-center gap-2 bg-rose text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Book a Free Consultation <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="/images/strength-tasks.jpg" alt="Strength training for health and function" loading="lazy" className="rounded-2xl w-full h-64 object-cover" />
              <img src="/images/specialise-1.jpg" alt="Adapted personal training session Worthing" loading="lazy" className="rounded-2xl w-full h-64 object-cover mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Specialist Areas */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
              Specialist Areas
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground mb-4">Who I Work With</h2>
            <p className="text-muted-foreground font-body text-base max-w-2xl mx-auto">
              I specialise in working with people who have been underserved by mainstream fitness. If your situation is not listed here, please still get in touch — the answer is almost always yes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {specialistAreas.map((area, idx) => (
              <div key={area.title} className={`bg-white rounded-2xl p-6 border ${idx % 2 === 0 ? 'border-teal/20' : 'border-muted'}`}>
                <h4 className="text-foreground text-base mb-2">{area.title}</h4>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What I Work On */}
      <section className="py-20 md:py-28 bg-section-dark">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
            <div>
              <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
                What I Work On
              </span>
                <h2 className="text-3xl md:text-4xl text-white leading-tight mb-4">
                  Recovery and Rehabilitation for Real Life
                </h2>
                <p className="text-white/70 font-body text-base mb-6">
                  The focus is functional rehabilitation — building strength, mobility, endurance, and capability for real life during and after health conditions. Not aesthetics. Not performance metrics. Real outcomes: returning to activities after cancer treatment, climbing stairs without pain, managing fatigue, walking further, recovering independence, sleeping better, regaining confidence in your own body.
                </p>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-rose flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sessionImages.map((img, i) => (
                <img key={i} src={img} alt="Personal training session Worthing" loading="lazy" className="rounded-2xl w-full h-52 object-cover" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {focusCards.map((card, idx) => (
              <div key={card.title} className={`bg-background/5 border border-white/10 rounded-2xl p-6 ${idx % 2 === 0 ? 'border-teal/20' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center mb-4">
                  <span className="text-teal text-lg">✦</span>
                </div>
                <h4 className="text-white text-lg mb-2">{card.title}</h4>
                <p className="text-white/70 font-body text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
            The Process
          </span>
          <h2 className="text-3xl md:text-4xl text-foreground mb-14">How It Works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-muted bg-teal/10 flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-teal flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-foreground text-base mb-2">{step.title}</h4>
                <p className="text-muted-foreground font-body text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 bg-rose text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Book a Free Consultation <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Related Blog Articles */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-rose text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4">
              Learn More
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground mb-4">Related Articles</h2>
            <p className="text-muted-foreground font-body text-base max-w-2xl mx-auto">
              Read more about training with health conditions, recovery strategies, and what makes specialist personal training different.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <Link href="/blog/exercise-illness" className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                <div className="bg-gradient-to-br from-rose/20 to-rose/10 h-40 flex items-center justify-center">
                  <span className="text-4xl">💪</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-foreground font-bold mb-2 group-hover:text-rose transition-colors">Exercise & Illness</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">Understanding how to stay active during health challenges and what's safe when managing chronic conditions.</p>
                  <div className="text-rose text-sm font-semibold hover:underline">Read Article →</div>
                </div>
              </div>
            </Link>

            <Link href="/blog/menopause-and-exercise" className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                <div className="bg-gradient-to-br from-rose/20 to-rose/10 h-40 flex items-center justify-center">
                  <span className="text-4xl">🏃</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-foreground font-bold mb-2 group-hover:text-rose transition-colors">Menopause & Exercise</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">How to train effectively through hormonal changes and manage strength, mobility, and energy during midlife transitions.</p>
                  <div className="text-rose text-sm font-semibold hover:underline">Read Article →</div>
                </div>
              </div>
            </Link>

            <Link href="/blog/myth-buster-does-resistance-training-cause-high-blood-pressure" className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                <div className="bg-gradient-to-br from-rose/20 to-rose/10 h-40 flex items-center justify-center">
                  <span className="text-4xl">❤️</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-foreground font-bold mb-2 group-hover:text-rose transition-colors">Resistance Training & Blood Pressure</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1">Safety considerations for people managing cardiovascular health and how resistance training can be part of a healthy approach.</p>
                  <div className="text-rose text-sm font-semibold hover:underline">Read Article →</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 border border-muted text-foreground px-6 py-3 rounded-full font-medium hover:bg-white transition-colors">
              View All Articles <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
