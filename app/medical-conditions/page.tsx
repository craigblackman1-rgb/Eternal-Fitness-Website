import type { Metadata } from "next";
import MedicalConditionsClient from "./MedicalConditionsClient";

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://eternal-fitness.co.uk/medical-conditions/#service",
  "name": "Personal Training for Medical Conditions Worthing",
  "description": "One-to-one personal training in Worthing for people living with a medical condition. Screened properly, paced to you, and adapted to how you feel on the day.",
  "url": "https://eternal-fitness.co.uk/medical-conditions",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Eternal Fitness",
    "@id": "https://eternal-fitness.co.uk/#business"
  },
  "areaServed": { "@type": "City", "name": "Worthing" },
  "serviceType": "Personal Training for People With Medical Conditions",
  "audience": {
    "@type": "Audience",
    "audienceType": "Adults living with a stable medical condition who want to exercise safely"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do I need my GP\u2019s permission first?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It depends on your condition and where you are with it. I screen everyone before we start, and if medical clearance is needed we get it documented. I\u2019m always happy to check in with your GP or consultant."
      }
    },
    {
      "@type": "Question",
      "name": "What if I have a bad day?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Then the session adapts. Every session starts with a check-in, and the plan changes to match how you feel on the day. Being honest about a bad day never means being told you can\u2019t train."
      }
    },
    {
      "@type": "Question",
      "name": "What if you\u2019re not the right trainer for me?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Then I\u2019ll tell you, and help you find who is. Sometimes that means splitting your programme with another specialist so you get the right expertise for each part."
      }
    },
    {
      "@type": "Question",
      "name": "I\u2019m not a \u201Cgym person\u201D. Is this for me?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Very often, yes. Many of the people I work with never saw themselves as gym people. Training is one-to-one in a private studio in Worthing, so there are no busy gym floors and no one watching."
      }
    }
  ]
};

export const metadata: Metadata = {
  title: "Exercising With a Medical Condition in Worthing",
  description: "One-to-one personal training in Worthing for people living with a medical condition. Screened properly, paced to you, and adapted to how you feel on the day.",
  alternates: { canonical: "https://eternal-fitness.co.uk/medical-conditions" },
};

export default function MedicalConditionsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <MedicalConditionsClient />
    </>
  );
}
