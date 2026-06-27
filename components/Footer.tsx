import Link from "next/link";
import { Phone, Mail, Facebook, Instagram, Linkedin, Youtube, MapPin } from "lucide-react";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://eternalfitness.co.uk/#website",
  "name": "Eternal Fitness",
  "url": "https://eternalfitness.co.uk",
  "description": "Private one-to-one personal training in Worthing with Level 4 qualified trainer Esther Fair.",
  "publisher": {
    "@type": "LocalBusiness",
    "@id": "https://eternalfitness.co.uk/#business"
  }
};

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-dark-navy rounded-sm";

const Footer = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <footer className="bg-dark-navy text-white">
        {/* Top: Logo + Description + Qualifications */}
        <div className="border-b border-white/10 px-6 md:px-12 py-14 md:py-16">
          <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-md">
              <Link href="/" aria-label="Eternal Fitness home" className={`inline-block ${focusRing}`}>
                <EternalFitnessLogo variant="light" className="h-9 md:h-10 w-auto" />
              </Link>
              <p className="text-[15px] text-white/65 leading-relaxed mt-4">
                Private, one-to-one personal training in Worthing for people with complex health needs. Level 4 qualified. GP-referred clients welcome.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <span className="text-[13px] font-semibold text-white/50 tracking-wider uppercase">Level 4 Personal Trainer</span>
              <span className="text-[13px] font-semibold text-white/50 tracking-wider uppercase">Cancer Rehabilitation Specialist</span>
              <span className="text-[13px] font-semibold text-white/50 tracking-wider uppercase">Exercise Referral Specialist</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="border-b border-white/10 px-6 md:px-12 py-14 md:py-16">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 lg:gap-12">
            {/* Contact */}
            <div>
              <h2 className="text-[13px] font-bold text-white/40 tracking-widest uppercase mb-5">Get in Touch</h2>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:07517658128"
                    className={`inline-flex items-center gap-3 text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}
                  >
                    <Phone className="w-4 h-4 text-rose shrink-0" aria-hidden="true" />
                    07517 658 128
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:esther.fair@eternal-fitness.co.uk"
                    className={`inline-flex items-center gap-3 text-[15px] text-white/70 hover:text-rose transition-colors break-all ${focusRing}`}
                  >
                    <Mail className="w-4 h-4 text-rose shrink-0" aria-hidden="true" />
                    esther.fair@eternal-fitness.co.uk
                  </a>
                </li>
                <li className="inline-flex items-center gap-3 text-[15px] text-white/50">
                  <MapPin className="w-4 h-4 text-rose shrink-0" aria-hidden="true" />
                  Worthing, West Sussex
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h2 className="text-[13px] font-bold text-white/40 tracking-widest uppercase mb-5">Services</h2>
              <ul className="space-y-3">
                <li>
                  <Link href="/personal-training" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>
                    Personal Training
                  </Link>
                </li>
                <li>
                  <Link href="/personal-training#specialist-areas" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>
                    Cancer Rehabilitation
                  </Link>
                </li>
                <li>
                  <Link href="/personal-training#specialist-areas" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>
                    Exercise Referral
                  </Link>
                </li>
                <li>
                  <Link href="/personal-training#specialist-areas" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>
                    Adaptive Training
                  </Link>
                </li>
                <li>
                  <Link href="/personal-training#specialist-areas" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>
                    Injury Recovery
                  </Link>
                </li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h2 className="text-[13px] font-bold text-white/40 tracking-widest uppercase mb-5">Information</h2>
              <ul className="space-y-3">
                <li><Link href="/about" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>About Me</Link></li>
                <li><Link href="/pricing" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>Pricing</Link></li>
                <li><Link href="/faqs" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>FAQs</Link></li>
                <li><Link href="/blog" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>Blog</Link></li>
                <li><Link href="/contact" className={`text-[15px] text-white/70 hover:text-rose transition-colors ${focusRing}`}>Contact</Link></li>
                <li><Link href="/terms" className={`text-[15px] text-white/50 hover:text-rose transition-colors ${focusRing}`}>Terms &amp; Conditions</Link></li>
              </ul>
            </div>

            {/* Follow */}
            <div>
              <h2 className="text-[13px] font-bold text-white/40 tracking-widest uppercase mb-5">Follow Me</h2>
              <div className="flex gap-3 flex-wrap mb-8">
                <a
                  href="https://www.facebook.com/EternalFitnessPersonalTraining/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className={`w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-rose hover:border-rose hover:text-white transition-all ${focusRing}`}
                >
                  <Facebook className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://instagram.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={`w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-rose hover:border-rose hover:text-white transition-all ${focusRing}`}
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://linkedin.com/in/esther-fair/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className={`w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-rose hover:border-rose hover:text-white transition-all ${focusRing}`}
                >
                  <Linkedin className="w-4.5 h-4.5" />
                </a>
                <a
                  href="https://youtube.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className={`w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:bg-rose hover:border-rose hover:text-white transition-all ${focusRing}`}
                >
                  <Youtube className="w-4.5 h-4.5" />
                </a>
              </div>
              <div className="text-[13px] font-bold text-white/40 tracking-widest uppercase mb-2">Location</div>
              <p className="text-[15px] text-white/60 leading-relaxed">Worthing, West Sussex</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 md:px-12 py-6">
          <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-white/40">
            <span>&copy; {new Date().getFullYear()} Eternal Fitness &middot; Esther Fair &middot; Worthing, West Sussex</span>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className={`hover:text-white/60 transition-colors ${focusRing}`}>Privacy Policy</Link>
              <Link href="/terms" className={`hover:text-white/60 transition-colors ${focusRing}`}>Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
