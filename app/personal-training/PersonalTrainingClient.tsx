"use client";

import Link from "next/link";
import { IconArrowUpRight, IconClipboardList, IconSearch, IconBarChart3, IconHeartHandshake, IconSparkles, IconRibbon, IconActivity, IconAccessibility, IconHeart, IconBloodPressure, IconFileText } from "@/components/icons";
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
    image: "/images/specialise-1.jpg",
    href: "/cancer-rehabilitation",
  },
  {
    title: "Chronic health conditions",
    desc: "Including autoimmune conditions, fibromyalgia, ME/CFS, heart conditions, diabetes, and more. Every session adapts to what your body can manage that day.",
    image: "/images/specialise-2.jpg",
    href: "/exercise-for-health",
  },
  {
    title: "Disability & adaptive training",
    desc: "Physical disabilities, significant mobility limitations, and sensory impairments including visual impairment. Programmes are built around your body, not a template.",
    image: "/images/specialise-3.jpg",
    href: "/exercise-for-health/visual-impairment",
  },
  {
    title: "GP-referred exercise",
    desc: "I am qualified in exercise referral and experienced in working alongside medical guidance from GPs and healthcare teams.",
    image: "/images/services-training.jpg",
    href: "/exercise-for-health",
  },
  {
    title: "Injury recovery & rehabilitation",
    desc: "Post-surgical, post-fracture, and musculoskeletal conditions. I work within the guidance of your physiotherapist or consultant.",
    image: "/images/mobility-movement.jpg",
  },
  {
    title: "Neurological conditions",
    desc: "Including Parkinson's, MS, stroke recovery, and acquired brain injury. Gentle, progressive, and always adapted.",
    image: "/images/mind-body.jpg",
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
    icon: IconClipboardList,
    title: "Free Consultation",
    desc: "A relaxed 30-minute conversation with me about your goals, health history, and what has and has not worked before. No pressure, no commitment.",
  },
  {
    icon: IconSearch,
    title: "Movement Assessment",
    desc: "I check your current mobility, strength, and any limitations before any programme begins — so training starts safely and clearly.",
  },
  {
    icon: IconBarChart3,
    title: "Your Programme",
    desc: "A plan built entirely around your body and your life. Session structure, exercises, and intensity are all tailored specifically to you.",
  },
  {
    icon: IconHeartHandshake,
    title: "Ongoing Support",
    desc: "I adjust your programme as your health and capacity change — keeping training sustainable, realistic, and aligned with where you are.",
  },
];

const relatedArticles = [
  {
    href: "/blog/exercise-illness",
    title: "Exercise & Illness",
    desc: "Understanding how to stay active during health challenges and what's safe when managing chronic conditions.",
    icon: IconActivity,
  },
  {
    href: "/blog/menopause-and-exercise",
    title: "Menopause & Exercise",
    desc: "How to train effectively through hormonal changes and manage strength, mobility, and energy during midlife transitions.",
    icon: IconHeart,
  },
  {
    href: "/blog/myth-buster-does-resistance-training-cause-high-blood-pressure",
    title: "Resistance Training & Blood Pressure",
    desc: "Safety considerations for people managing cardiovascular health and how resistance training can be part of a healthy approach.",
    icon: IconBloodPressure,
  },
];

export default function PersonalTrainingClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* Hero */}
      <section className="relative min-h-[70vh] pt-[72px] flex items-center justify-center overflow-hidden">
        <img src="/images/pt-hero.jpg" alt="Personal training in Worthing for health conditions and complex needs" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-hero-overlay/55 via-hero-overlay/65 to-hero-overlay/75" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Cancer Rehabilitation and Recovery Training in Worthing
          </h1>
          <p className="text-white/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
            Private one-to-one sessions with a Cancer Rehabilitation Specialist and Exercise Referral Specialist (Level 4 qualified). Whether you are in cancer treatment, post-surgery recovery, managing a chronic condition, living with a disability, or have complex medical needs — there is a specialist programme here for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={openDialog} className="ef-btn ef-btn-primary shadow-lg shadow-rose/30">
              Book a Free Consultation
            </button>
            <a href="#what" className="ef-btn ef-btn-ghost-white">What Sessions Involve</a>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section id="what" className="ef-section px-6 md:px-12 bg-background">
        <div className="max-w-[1320px] mx-auto">
          <div className="ef-eyebrow ef-eyebrow-rose mb-4">What to Expect</div>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-6">
                This Is Not Like Other Personal Training
              </h2>
              <div className="flex gap-4 mb-6">
                <img src="/images/approach-private.jpg" alt="Private one-to-one training session" loading="lazy" className="w-24 h-32 rounded-xl object-cover shrink-0" />
                <p className="ef-body text-sm">
                  Personal training at Eternal Fitness is not about pushing harder, going faster, or doing more. It is about rehabilitation, recovery, and what your body needs right now — whether managing a health condition, recovering from cancer treatment, or living with a disability — and building a sustainable programme around that. Sessions are private, one-to-one, and held in a small studio in Worthing where there is no gym floor, no other clients watching, and no comparison to anyone else.
                </p>
              </div>
              <p className="ef-body mb-6">
                My specialist training in cancer rehabilitation and exercise referral means I am trained to adapt to medical conditions, medication side-effects, fatigue cycles, and variable capacity. I work within your GP's or specialist's guidance. I do not guess — I ask, I listen, and I adjust every session based on your body's actual needs that day.
              </p>
              <button onClick={openDialog} className="ef-btn ef-btn-primary">
                Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="/images/strength-tasks.jpg" alt="Strength training for health and function" loading="lazy" className="rounded-3xl w-full h-64 object-cover" />
              <img src="/images/specialise-1.jpg" alt="Adapted personal training session Worthing" loading="lazy" className="rounded-3xl w-full h-64 object-cover mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Specialist Areas */}
      <section id="specialist-areas" className="ef-section px-6 md:px-12 bg-warm">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-end mb-16">
            <div>
              <div className="ef-eyebrow ef-eyebrow-rose mb-4">Specialist Areas</div>
              <h2 className="text-3xl md:text-4xl text-foreground ef-h2">Who I Work With</h2>
            </div>
            <p className="ef-body">
              I specialise in working with people who have been underserved by mainstream fitness. If your situation is not listed here, please still get in touch — the answer is almost always yes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {specialistAreas.map((area, idx) => {
              const cardContent = (
                <>
                  <div className="relative rounded-[20px] overflow-hidden aspect-[3/4] mb-5 shadow-[0_14px_40px_rgba(0,0,0,0.09)]">
                    <img src={area.image} alt={area.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-rose mb-1.5">{String(idx + 1).padStart(2, "0")}</div>
                  <h4 className="text-[22px] font-bold text-foreground tracking-tight mb-2 leading-tight">{area.title}</h4>
                  <p className="ef-body text-sm">{area.desc}</p>
                </>
              );
              const marginStyle = idx === 1 || idx === 4 ? "48px" : idx === 2 || idx === 5 ? "24px" : 0;
              return area.href ? (
                <Link key={area.title} href={area.href} className="group" style={{ marginTop: marginStyle, display: "block", textDecoration: "none" }}>
                  {cardContent}
                </Link>
              ) : (
                <div key={area.title} className="group" style={{ marginTop: marginStyle }}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What I Work On */}
      <section className="ef-section px-6 md:px-12 bg-background">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start mb-12">
            <div>
              <div className="ef-eyebrow ef-eyebrow-teal mb-4">What I Work On</div>
              <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-5">
                Recovery and Rehabilitation for Real Life
              </h2>
              <p className="ef-body mb-6">
                The focus is functional rehabilitation — building strength, mobility, endurance, and capability for real life during and after health conditions. Not aesthetics. Not performance metrics. Real outcomes: returning to activities after cancer treatment, climbing stairs without pain, managing fatigue, walking further, recovering independence, sleeping better, regaining confidence in your own body.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sessionImages.map((img, i) => (
                <img key={i} src={img} alt="Personal training session Worthing" loading="lazy" className="rounded-3xl w-full h-52 object-cover shadow-sm" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {focusCards.map((card) => (
              <div key={card.title} className="ef-card">
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-4">
                  <IconSparkles className="w-5 h-5 text-teal" />
                </div>
                <h4 className="text-foreground text-lg font-bold tracking-tight mb-2">{card.title}</h4>
                <p className="ef-body text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="ef-section px-6 md:px-12 bg-warm">
        <div className="max-w-[1320px] mx-auto text-center">
          <div className="ef-eyebrow ef-eyebrow-rose justify-center mb-4">The Process</div>
          <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-14">How It Works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full border-4 border-muted bg-teal/10 flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-teal flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h4 className="text-foreground text-base font-bold tracking-tight mb-2">{step.title}</h4>
                <p className="ef-body text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <button onClick={openDialog} className="ef-btn ef-btn-primary">
              Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Specialist Pages */}
      <section className="ef-section px-6 md:px-12 bg-background">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-center mb-14">
            <div className="ef-eyebrow ef-eyebrow-teal justify-center mb-4">Specialist Pages</div>
            <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-5">Condition-Specific Training</h2>
            <p className="ef-body max-w-2xl mx-auto">
              Each of my specialist areas has a dedicated page with more detail about how I work with specific conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { href: "/exercise-for-health", title: "Exercise for Health", desc: "Training for high blood pressure, type 2 diabetes, osteoporosis, COPD, heart conditions, chronic pain and more.", icon: IconFileText },
              { href: "/cancer-rehabilitation", title: "Cancer Rehabilitation", desc: "Training during active treatment, in remission, or post-surgery. Qualified and experienced in cancer rehabilitation.", icon: IconRibbon },
              { href: "/exercise-for-health/visual-impairment", title: "Visual Impairment", desc: "Adapted training for people who are blind or partially sighted. Verbal instruction, consistent environment, tactile guidance.", icon: IconAccessibility },
            ].map((page) => (
              <Link key={page.href} href={page.href} className="group">
                <div className="ef-card h-full flex flex-col hover:border-rose/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-teal/15 flex items-center justify-center mb-5">
                    <page.icon className="w-5 h-5 text-teal" />
                  </div>
                  <h3 className="text-foreground font-bold mb-2 group-hover:text-rose transition-colors">{page.title}</h3>
                  <p className="ef-body text-sm mb-4 flex-1">{page.desc}</p>
                  <div className="text-rose text-sm font-semibold flex items-center gap-1">Learn more <IconArrowUpRight className="w-3.5 h-3.5" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Blog Articles */}
      <section className="ef-section px-6 md:px-12 bg-background">
        <div className="max-w-[1320px] mx-auto">
          <div className="text-center mb-14">
            <div className="ef-eyebrow ef-eyebrow-rose justify-center mb-4">Learn More</div>
            <h2 className="text-3xl md:text-4xl text-foreground ef-h2 mb-5">Related Articles</h2>
            <p className="ef-body max-w-2xl mx-auto">
              Read more about training with health conditions, recovery strategies, and what makes specialist personal training different.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {relatedArticles.map((article) => (
              <Link key={article.href} href={article.href} className="group">
                <div className="ef-card h-full flex flex-col hover:border-rose/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-rose/15 flex items-center justify-center mb-5">
                    <article.icon className="w-5 h-5 text-rose" />
                  </div>
                  <h3 className="text-foreground font-bold mb-2 group-hover:text-rose transition-colors">{article.title}</h3>
                  <p className="ef-body text-sm mb-4 flex-1">{article.desc}</p>
                  <div className="text-rose text-sm font-semibold flex items-center gap-1">Read Article <IconArrowUpRight className="w-3.5 h-3.5" /></div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/blog" className="ef-btn ef-btn-outline">
              View All Articles <IconArrowUpRight className="w-4 h-4" />
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
