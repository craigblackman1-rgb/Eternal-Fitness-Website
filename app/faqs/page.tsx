import type { Metadata } from "next";
import FAQsPageClient from "./FAQsPageClient";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "Question",
        "position": 1,
        "name": "Do I need to be fit or healthy to start personal training?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Most clients start from a point where conventional fitness feels inaccessible. You do not need to have exercised before, be at a particular weight, or be healthy in the conventional sense. The only starting point is where you are right now."
        }
      },
      {
        "@type": "Question",
        "position": 2,
        "name": "Can you work with me if I have cancer or am going through cancer treatment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Esther holds a specialist qualification in cancer rehabilitation and has experience working with clients at all stages including during active treatment, in remission, and in long-term recovery. Every session is adapted to what your body can manage that day."
        }
      },
      {
        "@type": "Question",
        "position": 3,
        "name": "Can I do personal training if I have a disability?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Esther has experience working with clients with a wide range of physical disabilities and mobility limitations. Programmes are fully adaptive and built around your body, not a template."
        }
      },
      {
        "@type": "Question",
        "position": 4,
        "name": "I have a chronic health condition. Can personal training help me?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Almost certainly yes. Esther is qualified in exercise referral, which means she is specifically trained to work with people with clinical health conditions including heart conditions, diabetes, autoimmune conditions, fibromyalgia, ME/CFS, and many others."
        }
      },
      {
        "@type": "Question",
        "position": 5,
        "name": "How often should I train?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For most clients, two sessions per week is a good starting point. For those managing health conditions or recovering from illness, one session per week may be more appropriate initially. Esther will recommend a frequency that is sustainable and effective for your specific situation."
        }
      },
      {
        "@type": "Question",
        "position": 6,
        "name": "Where are personal training sessions held?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sessions take place in a private studio in Worthing, West Sussex. The studio is used exclusively for one-to-one training with no public gym floor and no other clients present. The address is confirmed at the point of booking."
        }
      },
      {
        "@type": "Question",
        "position": 7,
        "name": "My GP has referred me for exercise. Can you help?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Esther is qualified in exercise referral and experienced in working alongside medical guidance. If you have been referred through a GP exercise scheme or have a recommendation from your doctor, she can work directly with that guidance."
        }
      },
      {
        "@type": "Question",
        "position": 8,
        "name": "Do you work with trans and non-binary clients?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, without reservation. Esther works with clients across the full spectrum of gender identity and expression. You will be addressed and supported in whatever way feels right for you."
        }
      },
      {
        "@type": "Question",
        "position": 9,
        "name": "What if my health changes during a programme?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This is something Esther is specifically trained to manage. If your health changes, whether that is a new diagnosis, a flare-up, a change in medication, or simply a difficult period, your programme changes with it. You do not lose sessions and you do not fall behind."
        }
      }
    ]
  },
  "author": {
    "@type": "Person",
    "name": "Esther Fair",
    "url": "https://eternalfitness.co.uk/about"
  }
};

export const metadata: Metadata = {
  title: "FAQs: Cancer Rehab, Disability, Health Conditions Training",
  description: "Common questions about personal training at Eternal Fitness in Worthing. Health conditions, cancer rehab, disability, pricing and what to expect.",
  alternates: { canonical: "https://eternalfitness.co.uk/faqs" },
};

export default function FAQsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <FAQsPageClient />
    </>
  );
}
