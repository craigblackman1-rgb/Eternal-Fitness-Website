"use client";

import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqGroups = [
  {
    group: "Getting Started",
    faqs: [
      {
        question: "Do I need to be fit or healthy to start?",
        answer:
          "No. In fact, most of my clients start from a point where conventional fitness feels inaccessible. You do not need to have exercised before, you do not need to be at a particular weight, and you do not need to be healthy in the conventional sense. The only starting point is where you are right now.",
      },
      {
        question: "I have never used a personal trainer before. What can I expect?",
        answer:
          "Everything begins with a free consultation — a relaxed conversation about what you want to achieve and what your body is currently dealing with. There is no pressure and no commitment required. From there, I will design a programme specifically for you and walk you through every exercise at a pace that feels comfortable.",
      },
      {
        question: "How often should I train?",
        answer:
          "For most clients, two sessions per week is a good starting point. For those managing health conditions or recovering from illness, one session per week may be more appropriate initially. I will recommend a frequency that is sustainable and effective for your specific situation — never more than your body can handle.",
      },
      {
        question: "Where are sessions held?",
        answer:
          "Sessions take place in a private studio in Worthing, West Sussex. The studio is used exclusively for one-to-one training — there is no public gym floor, no other clients present, and no waiting around. The address is confirmed at the point of booking.",
      },
    ],
  },
  {
    group: "Health Conditions & Complex Needs",
    faqs: [
      {
        question: "I have cancer or am going through cancer treatment. Can you still work with me?",
        answer:
          "Yes. I hold a specialist qualification in cancer rehabilitation and have experience working with clients at all stages — during active treatment, in remission, and in long-term recovery. Exercise has a significant evidence base for supporting people through cancer and its treatment. I work closely with your medical team where appropriate and adapt every session to what your body can manage that day.",
      },
      {
        question: "I have a chronic health condition. Can personal training still help me?",
        answer:
          "Almost certainly yes. I am qualified in exercise referral, which means I am specifically trained to work with people who have clinical health conditions — including heart conditions, diabetes, autoimmune conditions, fibromyalgia, ME/CFS, and many others. Every programme is adapted to what your body can manage, and adjusted regularly as your health changes.",
      },
      {
        question: "I have a disability. Can I still do personal training?",
        answer:
          "Yes. I have experience working with clients with a wide range of physical disabilities and mobility limitations. Programmes are fully adaptive. If you use a wheelchair or have very limited mobility, that is the starting point — not a barrier. Please get in touch to discuss your specific situation.",
      },
      {
        question: "I have extremely limited mobility. Is there still something I can do?",
        answer:
          "Yes. My approach is to start from where you are, whatever that looks like. Some clients begin with very gentle seated exercises, breathing work, or small range-of-motion movements. Progress looks different for everyone and is always measured against your own baseline — not anyone else's.",
      },
      {
        question: "I am visually impaired or blind. Can you work with me?",
        answer:
          "Yes. I have experience working with visually impaired clients. All exercises are adapted and described verbally in full detail, with complete awareness of sensory needs throughout every session. Please get in touch to discuss your specific situation.",
      },
      {
        question: "My GP has referred me for exercise. Can you help?",
        answer:
          "Yes. I am qualified in exercise referral and experienced in working alongside medical guidance. If you have been referred through a GP exercise scheme or have a recommendation from your doctor, I can work directly with that guidance and liaise with your healthcare team where useful.",
      },
      {
        question: "I have an injury. Is it safe to exercise?",
        answer:
          "In most cases yes, though it depends on the injury and the stage of recovery. I always start with an assessment and will not take on a client if I believe exercise would be harmful. For recent injuries or post-surgical clients, I work within the guidance of physiotherapists and medical teams.",
      },
    ],
  },
  {
    group: "Inclusive Training",
    faqs: [
      {
        question: "Do you work with trans and non-binary clients?",
        answer:
          "Yes, without reservation. I work with clients across the full spectrum of gender identity and expression. You will be addressed and supported in whatever way feels right for you. If you have specific physical goals related to your gender identity, I will work with you on those without judgement.",
      },
      {
        question: "I have always felt uncomfortable or unwelcome in fitness spaces. Is this different?",
        answer:
          "This is the most common thing I hear. The private studio, the one-to-one format, and the complete absence of any mirror-and-performance culture is specifically designed to make it different. There is no dress code, no weigh-in, and no expectation of what fitness should look like. Many of my clients come to me having had negative experiences elsewhere. Most of them stay for years.",
      },
    ],
  },
  {
    group: "Practicalities",
    faqs: [
      {
        question: "Do you offer short-term programmes?",
        answer:
          "Yes. While I believe in the long-term approach, I offer flexible options to suit different needs and budgets. I will recommend what I think is realistic for your goals during the initial consultation.",
      },
      {
        question: "What if my health changes during a programme?",
        answer:
          "This is something I am specifically trained to manage. If your health changes — whether that is a new diagnosis, a flare-up, a change in medication, or simply a difficult period — your programme changes with it. You do not lose sessions and you do not fall behind. You just adapt.",
      },
      {
        question: "Can I bring someone with me to sessions?",
        answer:
          "If having a carer, family member, or support person present would make you more comfortable, please let me know. I will accommodate wherever possible.",
      },
      {
        question: "My question is not answered here. What should I do?",
        answer:
          "Just get in touch. There is no question too small or too complicated. I would always rather speak to someone who is not sure than have them talk themselves out of trying.",
      },
    ],
  },
];

export default function FAQsPageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <img src="/images/hero-gym.jpg" alt="Frequently Asked Questions — Eternal Fitness Worthing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/70" />
        <div className="relative z-10 text-center max-w-2xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 font-body text-lg md:text-xl mb-8 max-w-lg mx-auto">
            If something is stopping you from getting in touch, the answer is probably here. And if it is not — just ask.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Book a Free Consultation
            </button>
            <a href="#faq" className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
              Read the FAQs
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[340px_1fr] gap-12 md:gap-20 items-start">

          {/* Left — intro */}
          <div className="md:sticky md:top-24">
            <span className="inline-flex items-center gap-2 bg-rose/10 text-rose px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              ✦ Your Questions Answered
            </span>
            <h2 className="text-3xl md:text-4xl text-foreground leading-tight mb-4">
              No question is too complicated
            </h2>
            <p className="text-muted-foreground font-body text-base mb-6">
              I work with people whose situations are rarely straightforward. If you are wondering whether your health, disability, or circumstances make you a difficult client — they almost certainly do not.
            </p>
            <p className="text-muted-foreground font-body text-sm mb-8">
              The questions below cover the things people most commonly wonder about before getting in touch.
            </p>
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 bg-rose text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Book a Free Consultation <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right — grouped FAQs */}
          <div className="space-y-12">
            {faqGroups.map((group) => (
              <div key={group.group}>
                <h3 className="text-sm font-medium text-rose uppercase tracking-wider mb-4 pb-2 border-b border-muted">
                  {group.group}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {group.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`${group.group}-${i}`} className="border-muted">
                      <AccordionTrigger className="font-body text-foreground text-left text-base py-5 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground font-body text-sm leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
