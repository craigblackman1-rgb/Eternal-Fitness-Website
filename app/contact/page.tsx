import type { Metadata } from "next";
import { getPageContentBlocks } from "@/lib/pageContent";
import ContactPageClient from "./ContactPageClient";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Eternal Fitness",
  "url": "https://eternalfitness.co.uk/contact",
  "description": "Get in touch with Esther Fair at Eternal Fitness in Worthing. Book a free consultation by phone, email, or contact form.",
  "mainEntity": {
    "@type": "LocalBusiness",
    "name": "Eternal Fitness",
    "@id": "https://eternalfitness.co.uk/#business",
    "telephone": "07517658128",
    "email": "esther.fair@eternal-fitness.co.uk",
    "address": { "@type": "PostalAddress", "addressLocality": "Worthing", "addressRegion": "West Sussex", "addressCountry": "GB" }
  }
};

export const metadata: Metadata = {
  title: "Contact Eternal Fitness — Book a Free Consultation in Worthing",
  description: "Get in touch with Esther Fair at Eternal Fitness in Worthing. Call 07517 658 128, email, or use the contact form to book your free 30-minute consultation.",
  alternates: { canonical: "https://eternalfitness.co.uk/contact" },
};

export default async function ContactPage() {
  const content = await getPageContentBlocks("contact");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <ContactPageClient content={content} />
    </>
  );
}
