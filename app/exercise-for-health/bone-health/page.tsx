import type { Metadata } from "next";
import BoneHealthClient from "./BoneHealthClient";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://eternal-fitness.co.uk/exercise-for-health/bone-health/#service",
  "name": "Exercise for Osteoporosis and Bone Health Worthing",
  "description": "Personal training for osteoporosis and bone health in Worthing. Safe, progressive weight-bearing and resistance exercise to maintain bone density and reduce fracture risk.",
  "url": "https://eternal-fitness.co.uk/exercise-for-health/bone-health",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Eternal Fitness",
    "@id": "https://eternal-fitness.co.uk/#business"
  },
  "areaServed": { "@type": "City", "name": "Worthing" },
  "serviceType": "Exercise for Bone Health",
  "audience": {
    "@type": "Audience",
    "audienceType": "People with osteoporosis or osteopenia seeking safe personal training"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is exercise safe if I have osteoporosis?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — exercise is clinically recommended for managing osteoporosis and reducing fracture risk. The key is choosing the right type and intensity of loading. Weight-bearing and resistance exercises strengthen bone, while balance work reduces fall risk. A qualified specialist will know which movements to include and which to avoid based on your specific bone health status."
      }
    },
    {
      "@type": "Question",
      "name": "What types of exercise help strengthen bones?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Weight-bearing activities and resistance training are the most effective for stimulating bone density. This includes exercises like squats, lunges, presses, and rows performed at controlled loads. I also incorporate impact modulation — controlled, low-level impact where appropriate — alongside balance and mobility work to reduce fall risk."
      }
    },
    {
      "@type": "Question",
      "name": "Can exercise reduce my fracture risk?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, in two ways. Firstly, appropriate resistance training slows bone density loss and can maintain or improve bone strength. Secondly, balance and mobility training significantly reduces the risk of falls — which is the most common cause of fractures in people with osteoporosis. Both are built into every programme."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a GP referral before starting?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not necessarily, but I will ask about your diagnosis, any recent DEXA scan results, fracture history, and current medical guidance. If you have had a recent fracture or have severe osteoporosis, I may recommend checking with your GP or specialist before we begin. Safety comes first."
      }
    }
  ]
};

export const metadata: Metadata = {
  title: "Exercise for Osteoporosis & Bone Health",
  description: "Specialist personal training for osteoporosis and bone health in Worthing. Safe weight-bearing and resistance exercise to maintain bone density. Level 4 qualified.",
  alternates: { canonical: "https://eternal-fitness.co.uk/exercise-for-health/bone-health" },
};

export default function BoneHealthPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <BoneHealthClient />
    </>
  );
}
