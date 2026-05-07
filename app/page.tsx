import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://eternalfitness.co.uk/#business",
  "name": "Eternal Fitness",
  "description": "Private one-to-one personal training in Worthing with Level 4 qualified trainer Esther Fair. Specialist support for health conditions, cancer rehabilitation, disability and complex needs.",
  "url": "https://eternalfitness.co.uk",
  "telephone": "07517658128",
  "email": "esther.fair@eternal-fitness.co.uk",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Worthing",
    "addressRegion": "West Sussex",
    "postalCode": "BN11",
    "addressCountry": "GB"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "50.8179", "longitude": "-0.3721" },
  "areaServed": [
    { "@type": "City", "name": "Worthing" },
    { "@type": "City", "name": "Brighton" },
    { "@type": "City", "name": "Shoreham-by-Sea" },
    { "@type": "AdministrativeArea", "name": "West Sussex" }
  ],
  "priceRange": "££",
  "image": "https://eternalfitness.co.uk/og-image.svg",
  "sameAs": ["https://www.facebook.com/EternalFitnessPersonalTraining/"],
  "founder": { "@type": "Person", "name": "Esther Fair", "jobTitle": "Level 4 Personal Trainer" },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Personal Training Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Single Personal Training Session", "description": "60-minute one-to-one personal training session in a private studio in Worthing." }, "price": "45", "priceCurrency": "GBP" },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Block of 12 Personal Training Sessions", "description": "12 x 60-minute personal training sessions with programme review and adjustment." }, "price": "480", "priceCurrency": "GBP" },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Block of 24 Personal Training Sessions", "description": "24 x 60-minute personal training sessions with ongoing programme management and priority scheduling." }, "price": "840", "priceCurrency": "GBP" }
    ]
  }
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Esther Fair",
  "jobTitle": "Level 4 Personal Trainer",
  "url": "https://eternalfitness.co.uk/about",
  "telephone": "07517658128",
  "email": "esther.fair@eternal-fitness.co.uk",
  "worksFor": { "@type": "LocalBusiness", "name": "Eternal Fitness", "@id": "https://eternalfitness.co.uk/#business" },
  "address": { "@type": "PostalAddress", "addressLocality": "Worthing", "addressRegion": "West Sussex", "addressCountry": "GB" },
  "knowsAbout": ["Personal Training", "Cancer Rehabilitation", "Exercise Referral", "Adaptive Fitness", "Chronic Health Conditions", "Disability Fitness", "Injury Recovery", "Strength Training", "Mobility Training"],
  "hasCredential": [
    { "@type": "EducationalOccupationalCredential", "name": "Level 4 Personal Trainer" },
    { "@type": "EducationalOccupationalCredential", "name": "Exercise Referral Specialist" },
    { "@type": "EducationalOccupationalCredential", "name": "Cancer Rehabilitation Specialist" }
  ],
  "sameAs": ["https://www.facebook.com/EternalFitnessPersonalTraining/"]
};

export const metadata: Metadata = {
  title: "Level 4 Personal Trainer for Health Conditions in Worthing",
  description: "Private one-to-one personal training in Worthing with Level 4 trainer Esther Fair. Specialist for health conditions, cancer rehab, disability and more.",
  alternates: { canonical: "https://eternalfitness.co.uk/" },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <HomePageClient />
    </>
  );
}
