import type { Metadata } from "next";
import { getPageContentBlocks } from "@/lib/pageContent";
import PersonalTrainingClient from "./PersonalTrainingClient";

const ptSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://eternal-fitness.co.uk/personal-training/#service",
  "name": "Personal Training in Worthing",
  "description": "One-to-one personal training in Worthing for people with health conditions, cancer rehabilitation needs, disabilities, injuries, and complex needs. Level 4 qualified trainer.",
  "url": "https://eternal-fitness.co.uk/personal-training",
  "provider": { "@type": "LocalBusiness", "name": "Eternal Fitness", "@id": "https://eternal-fitness.co.uk/#business" },
  "areaServed": { "@type": "City", "name": "Worthing" },
  "serviceType": "Personal Training",
  "audience": { "@type": "Audience", "audienceType": "People with health conditions, disabilities, injuries, and complex needs seeking personal training" },
  "hasOfferCatalog": {
    "@type": "OfferCatalog", "name": "Personal Training Sessions",
    "itemListElement": [
      { "@type": "Offer", "name": "Single Session", "price": "45", "priceCurrency": "GBP" },
      { "@type": "Offer", "name": "Block of 12", "price": "480", "priceCurrency": "GBP" },
      { "@type": "Offer", "name": "Block of 24", "price": "840", "priceCurrency": "GBP" }
    ]
  }
};

export const metadata: Metadata = {
  title: "Personal Training in Worthing for Health Conditions and Complex Needs",
  description: "Personal training in Worthing with a Level 4 specialist. Sessions adapted for health conditions, cancer rehab, disability, injury recovery and GP referrals.",
  alternates: { canonical: "https://eternal-fitness.co.uk/personal-training" },
};

export default async function PersonalTrainingPage() {
  const content = await getPageContentBlocks("personal-training");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ptSchema) }} />
      <PersonalTrainingClient content={content} />
    </>
  );
}
