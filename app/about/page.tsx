import type { Metadata } from "next";
import { getPageContentBlocks } from "@/lib/pageContent";
import AboutPageClient from "./AboutPageClient";

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Esther Fair",
    "jobTitle": "Level 4 Personal Trainer",
    "description": "Level 4 personal trainer, exercise referral specialist, and cancer rehabilitation qualified. Based in a private studio in Worthing, West Sussex.",
    "url": "https://eternal-fitness.co.uk/about",
    "worksFor": { "@type": "LocalBusiness", "name": "Eternal Fitness", "@id": "https://eternal-fitness.co.uk/#business" },
    "hasCredential": [
      { "@type": "EducationalOccupationalCredential", "name": "Level 4 Personal Trainer" },
      { "@type": "EducationalOccupationalCredential", "name": "Exercise Referral Specialist" },
      { "@type": "EducationalOccupationalCredential", "name": "Cancer Rehabilitation Specialist" }
    ]
  }
};

export const metadata: Metadata = {
  title: "Esther Fair: Specialist in Cancer Rehab & Complex Health Needs",
  description: "Meet Esther Fair: Cancer Rehabilitation & Exercise Referral Specialist. Level 4 qualified trainer for health conditions, disabilities, and complex needs.",
  alternates: { canonical: "https://eternal-fitness.co.uk/about" },
};

export default async function AboutPage() {
  const content = await getPageContentBlocks("about");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />
      <AboutPageClient content={content} />
    </>
  );
}
