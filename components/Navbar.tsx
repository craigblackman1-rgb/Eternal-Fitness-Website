"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import { IconMenu, IconX, IconArrowUpRight } from "@/components/icons";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  {
    label: "Personal Training",
    to: "/personal-training",
    children: [
      { label: "Exercise for Health", to: "/exercise-for-health" },
      { label: "Cancer Rehabilitation", to: "/cancer-rehabilitation" },
    ],
  },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQs", to: "/faqs" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

interface NavbarProps {
  onBookConsultation?: () => void;
}

const SITE_URL = "https://eternalfitness.co.uk";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/personal-training": "Personal Training",
  "/exercise-for-health": "Exercise for Health",
  "/cancer-rehabilitation": "Cancer Rehabilitation",
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
            ? "bg-white/[0.97] border-b border-border-warm"
            : "bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center" aria-label="Eternal Fitness home">
          <EternalFitnessLogo variant={isLit ? "dark" : "light"} className="h-7 md:h-8 w-auto" />
        </Link>

{/* Desktop nav */}
        <ul className={`hidden md:flex items-center gap-8 text-sm font-medium ${isLit ? "text-charcoal/70" : "text-white/80"}`}>
          {navItems.map((item) => {
            if (item.children) {
              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.to}
                    className={`transition-colors ${
                      pathname === item.to || item.children.some(c => pathname === c.to || pathname.startsWith(c.to + '/'))
                        ? `${isLit ? "text-charcoal" : "text-white"} font-semibold`
                        : isLit
                        ? "hover:text-charcoal"
                        : "hover:text-white"
                    } flex items-center gap-1`}
                  >
                    {item.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:rotate-180">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Link>
                  {/* Dropdown */}
                  <div
                    className="absolute left-0 top-full pt-3 w-56 opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-200 z-50"
                  >
                    <div className="bg-white border border-border-warm rounded-2xl shadow-lg py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.to}
                          className="block px-4 py-2.5 text-charcoal/70 hover:text-charcoal hover:bg-warm transition-colors text-sm"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              );
            }
            return (
              <li key={item.label}>
                <Link
                  href={item.to}
                  className={`transition-colors ${
                    pathname === item.to
                      ? `${isLit ? "text-charcoal" : "text-white"} font-semibold`
                      : isLit
                      ? "hover:text-charcoal"
                      : "hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          {onBookConsultation ? (
            <button
              onClick={onBookConsultation}
              className="ef-btn ef-btn-primary text-sm py-2.5 px-5"
            >
              Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/contact"
              className="ef-btn ef-btn-primary text-sm py-2.5 px-5"
            >
              Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden ${isLit ? "text-charcoal" : "text-white"}`}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <IconX className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
        </button>
      </nav>

{/* Mobile menu */}
      <div
        className={`fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-border-warm p-6 md:hidden flex flex-col gap-4 shadow-lg transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div className="space-y-2 pl-2 border-l-2 border-rose/30">
                {item.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.to}
                    onClick={() => setOpen(false)}
                    className="block text-charcoal/70 hover:text-charcoal text-sm font-medium py-1"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                href={item.to}
                onClick={() => setOpen(false)}
                className="text-charcoal/80 hover:text-charcoal text-sm font-medium"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
        {onBookConsultation ? (
          <button
            onClick={() => { setOpen(false); onBookConsultation(); }}
            className="ef-btn ef-btn-primary text-sm w-fit"
          >
            Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="ef-btn ef-btn-primary text-sm w-fit"
          >
            Book a Free Consultation <IconArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </>
  );
};

export default Navbar;
