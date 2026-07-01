import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif-display",
});

const SITE_URL = "https://eternalfitness.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Eternal Fitness | Level 4 Personal Trainer in Worthing",
    template: "%s | Eternal Fitness",
  },
  description:
    "Private one-to-one personal training in Worthing with Level 4 qualified trainer Esther Fair. Specialist support for health conditions, cancer rehabilitation, disability and complex needs.",
  openGraph: {
    siteName: "Eternal Fitness",
    locale: "en_GB",
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Eternal Fitness — Level 4 Personal Trainer in Worthing" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
  other: {
    "geo.region": "GB-WSX",
    "geo.placename": "Worthing, West Sussex",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
        <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
