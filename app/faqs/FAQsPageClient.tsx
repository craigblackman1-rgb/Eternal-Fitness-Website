"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { Section, PageHero, StatBadge, CTABand, Eyebrow, CtaButton } from "@/components/ds";
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

      <PageHero
        image="/images/hero-gym.jpg"
        imageAlt="Frequently Asked Questions — Eternal Fitness Worthing"
        eyebrow="FAQs"
        heading="Frequently Asked Questions"
        subhead="If something is stopping you from getting in touch, the answer is probably here. And if it is not — just ask."
        primaryCta={{ label: "Book a Free Consultation", onClick: openDialog, arrow: true }}
        secondaryCta={{ label: "Read the FAQs", href: "#faq", variant: "ghost-white" }}
        badge={<StatBadge value="?" label="No question too small" sublabel="Just ask — I would rather you did" />}
      />

      {/* FAQ Section */}
      <Section background="white" id="faq" innerClassName="grid md:grid-cols-[340px_1fr] gap-12 md:gap-20 items-start">

          {/* Left — intro */}
          <div className="md:sticky md:top-24">
            <Eyebrow color="rose">Your Questions Answered</Eyebrow>
            <h2 className="ds-h2" style={{ margin: "16px 0" }}>
              No question is too complicated
            </h2>
            <p className="ds-body" style={{ marginBottom: 16 }}>
              I work with people whose situations are rarely straightforward. If you are wondering whether your health, disability, or circumstances make you a difficult client — they almost certainly do not.
            </p>
            <p className="ds-body" style={{ marginBottom: 28, fontSize: 14.5 }}>
              The questions below cover the things people most commonly wonder about before getting in touch.
            </p>
            <CtaButton cta={{ label: "Book a Free Consultation", onClick: openDialog, arrow: true }} />
          </div>

          {/* Right — grouped FAQs */}
          <div className="space-y-12">
            {faqGroups.map((group, gi) => (
              <div key={group.group}>
                <h3 className={`text-[11px] font-bold tracking-[0.1em] uppercase mb-4 pb-2 border-b border-border-warm ${gi % 2 === 0 ? "text-teal" : "text-rose"}`}>
                  {group.group}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {group.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`${group.group}-${i}`} className="border-border-warm">
                      <AccordionTrigger className="font-body text-foreground text-left text-base py-5 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="ef-body text-sm pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
      </Section>

      <CTABand
        image="/images/studio-1.jpg"
        heading="Ready to find out if this is right for you?"
        body="The first conversation is free, with no commitment. I work with a small number of clients at a time — so every person gets my full attention."
        primaryCta={{ label: "Book a Free Consultation", onClick: openDialog }}
        secondaryCta={{ label: "Call: 07517 658 128", href: "tel:07517658128", variant: "ghost-white" }}
      />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
