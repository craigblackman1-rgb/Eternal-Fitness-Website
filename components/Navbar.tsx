"use client";

import { useState, useEffect } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLit = scrolled || open;

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

      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] px-6 md:px-12 flex items-center justify-between transition-all duration-300 ${
          isLit
            ? "bg-[rgba(255,255,255,0.97)] border-b border-[#E4DDD7]"
            : "bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center" aria-label="Eternal Fitness home">
          <EternalFitnessLogo variant={isLit ? "dark" : "light"} className="h-7 md:h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <ul className={`hidden md:flex items-center gap-8 text-sm font-medium ${isLit ? "text-[#3C3C3C]/70" : "text-white/80"}`}>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.to}
                className={`transition-colors ${
                  pathname === item.to
                    ? `${isLit ? "text-[#3C3C3C]" : "text-white"} font-semibold`
                    : isLit
                      ? "hover:text-[#3C3C3C]"
                      : "hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          {onBookConsultation ? (
            <button
              onClick={onBookConsultation}
              className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Contact Us <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Contact Us <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden ${isLit ? "text-[#3C3C3C]" : "text-white"}`}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-[#E4DDD7] p-6 md:hidden flex flex-col gap-4 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.to}
              onClick={() => setOpen(false)}
              className="text-[#3C3C3C]/80 hover:text-[#3C3C3C] text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          {onBookConsultation ? (
            <button
              onClick={() => { setOpen(false); onBookConsultation(); }}
              className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-full text-sm font-semibold w-fit"
            >
              Contact Us <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 bg-rose text-white px-5 py-2.5 rounded-full text-sm font-semibold w-fit"
            >
              Contact Us <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
