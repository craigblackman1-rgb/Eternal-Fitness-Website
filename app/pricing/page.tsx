import type { Metadata } from "next";
import { getPageContentBlocks } from "@/lib/pageContent";
import PricingPageClient from "./PricingPageClient";

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Personal Training Pricing — Eternal Fitness Worthing",
  "url": "https://eternal-fitness.co.uk/pricing",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Single Personal Training Session",
        "description": "60-minute one-to-one personal training session in a private studio in Worthing. Full health and mobility assessment on first visit.",
        "brand": { "@type": "Brand", "name": "Eternal Fitness" },
        "offers": {
          "@type": "Offer",
          "price": "45",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "LocalBusiness", "name": "Eternal Fitness" }
        }
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "Product",
        "name": "Block of 12 Personal Training Sessions",
        "description": "12 x 60-minute personal training sessions with programme review and adjustment included. Save £5 per session vs pay-as-you-go.",
        "brand": { "@type": "Brand", "name": "Eternal Fitness" },
        "offers": {
          "@type": "Offer",
          "price": "480",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "LocalBusiness", "name": "Eternal Fitness" }
        }
      }
    },
    {
      "@type": "ListItem",
      "position": 3,
      "item": {
        "@type": "Product",
        "name": "Block of 24 Personal Training Sessions",
        "description": "24 x 60-minute personal training sessions with ongoing programme management and priority scheduling. Save £10 per session vs pay-as-you-go.",
        "brand": { "@type": "Brand", "name": "Eternal Fitness" },
        "offers": {
          "@type": "Offer",
          "price": "840",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "LocalBusiness", "name": "Eternal Fitness" }
        }
      }
    }
  ]
};

export const metadata: Metadata = {
  title: "Cancer Rehabilitation Training Pricing in Worthing from £45",
  description: "Specialist personal training pricing in Worthing. Sessions from £45. No contracts, no surprises. Free consultation with all packages.",
  alternates: { canonical: "https://eternal-fitness.co.uk/pricing" },
};

export default async function PricingPage() {
  const content = await getPageContentBlocks("pricing");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <PricingPageClient content={content} />
    </>
  );
}
