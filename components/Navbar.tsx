"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import { Menu, X, ArrowUpRight } from "lucide-react";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Personal Training", to: "/personal-training" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQs", to: "/faqs" },
  { label: "Blog", to: "/blog" },
];

interface NavbarProps {
  onBookConsultation?: () => void;
}

const SITE_URL = "https://eternalfitness.co.uk";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/personal-training": "Personal Training",
  "/pricing": "Pricing",
  "/faqs": "FAQs",
  "/blog": "Blog",
  "/contact": "Contact",
};

const Navbar = ({ onBookConsultation }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const breadcrumbItems: Array<{ "@type": string; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ];

  const currentTitle = pageTitles[pathname];
  if (currentTitle && pathname !== "/") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: currentTitle,
      item: `${SITE_URL}${pathname}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="absolute top-0 left-0 right-0 z-50 mx-6 md:mx-12 mt-5 flex items-center justify-between px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl">
        <Link href="/" className="flex items-center">
          <EternalFitnessLogo variant="light" className="h-7 md:h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-body text-white/80">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.to}
                className={`hover:text-white transition-colors ${
                  pathname === item.to ? "text-white font-medium" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {onBookConsultation ? (
          <button
            onClick={onBookConsultation}
            className="hidden md:inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Contact Us <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Contact Us <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile menu */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-dark-navy/95 backdrop-blur-xl rounded-2xl border border-white/10 md:hidden py-6 px-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.to}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white text-sm font-body"
              >
                {item.label}
              </Link>
            ))}
            {onBookConsultation ? (
              <button
                onClick={() => { setOpen(false); onBookConsultation(); }}
                className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-xl text-sm font-semibold w-fit"
              >
                Contact Us <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-xl text-sm font-semibold w-fit"
              >
                Contact Us <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
