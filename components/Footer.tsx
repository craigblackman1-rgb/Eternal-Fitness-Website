import Link from "next/link";
import { Phone, Mail, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
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

const Footer = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <footer id="contact" className="bg-ink">
        {/* Top */}
        <div className="border-b border-white/[0.07] px-6 md:px-12 py-16 md:py-20">
          <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <Link href="/" aria-label="Eternal Fitness home">
              <EternalFitnessLogo variant="light" className="h-9 md:h-10 w-auto" />
            </Link>
            <div className="text-left md:text-right">
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-3">Qualifications</div>
              <div className="flex items-center gap-3 text-[13px] text-white/40 mb-1.5 md:justify-end">
                Level 4 Personal Trainer
                <span className="w-[18px] h-[1px] bg-rose/70 shrink-0" />
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/40 mb-1.5 md:justify-end">
                Cancer Rehabilitation Specialist
                <span className="w-[18px] h-[1px] bg-rose/70 shrink-0" />
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/40 md:justify-end">
                Exercise Referral Specialist
                <span className="w-[18px] h-[1px] bg-rose/70 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="border-b border-white/[0.07] px-6 md:px-12 py-14 md:py-16">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_.9fr] gap-10 lg:gap-12">
            {/* Brand + Contact */}
            <div>
              <p className="text-[13px] text-white/40 leading-[1.7] mb-6 max-w-[280px]">
                Private, one-to-one personal training in Worthing for people with complex health needs. Level 4 qualified. GP-referred clients welcome.
              </p>
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-5">Get in Touch</div>
              <a href="tel:07517658128" className="flex items-center gap-3 text-[13.5px] text-white/50 hover:text-white transition-colors mb-2.5">
                <Phone className="w-4 h-4 text-rose shrink-0" /> 07517 658 128
              </a>
              <a href="mailto:esther.fair@eternal-fitness.co.uk" className="flex items-center gap-3 text-[13.5px] text-white/50 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-rose shrink-0" /> esther.fair@eternal-fitness.co.uk
              </a>
            </div>

            {/* Services */}
            <div>
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-5">Services</div>
              <ul className="space-y-2.5 text-[13.5px] text-white/50">
                <li><Link href="/personal-training" className="hover:text-rose transition-colors">Personal Training</Link></li>
                <li className="hover:text-rose transition-colors cursor-pointer">Cancer Rehabilitation</li>
                <li className="hover:text-rose transition-colors cursor-pointer">Exercise Referral</li>
                <li className="hover:text-rose transition-colors cursor-pointer">Adaptive Training</li>
                <li className="hover:text-rose transition-colors cursor-pointer">Injury Recovery</li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-5">Information</div>
              <ul className="space-y-2.5 text-[13.5px] text-white/50">
                <li><Link href="/about" className="hover:text-rose transition-colors">About Me</Link></li>
                <li><Link href="/pricing" className="hover:text-rose transition-colors">Pricing</Link></li>
                <li><Link href="/faqs" className="hover:text-rose transition-colors">FAQs</Link></li>
                <li><Link href="/contact" className="hover:text-rose transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-rose transition-colors">Terms &amp; Conditions</Link></li>
              </ul>
            </div>

            {/* Follow */}
            <div>
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-5">Follow me</div>
              <div className="flex gap-2.5 flex-wrap mb-8">
                <a
                  href="https://www.facebook.com/EternalFitnessPersonalTraining/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:bg-rose hover:border-rose hover:text-white transition-all"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:bg-rose hover:border-rose hover:text-white transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/in/esther-fair/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:bg-rose hover:border-rose hover:text-white transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/45 hover:bg-rose hover:border-rose hover:text-white transition-all"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <div className="text-[10px] font-bold text-white/30 tracking-[0.14em] uppercase mb-2">Location</div>
              <p className="text-[13px] text-white/40 leading-[1.7]">Worthing<br />West Sussex</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 md:px-12 py-5">
          <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-white/25">
            <span>© 2026 Eternal Fitness · Esther Fair · Worthing, West Sussex</span>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white/50 transition-colors">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
