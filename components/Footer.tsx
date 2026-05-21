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

      <footer id="contact" className="bg-white border-t border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand + Contact */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <EternalFitnessLogo variant="dark" className="h-7 w-auto" />
              </Link>
              <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                Private, one-to-one personal training in Worthing. Level 4 qualified. Exercise referral specialist. Cancer rehabilitation.
              </p>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Get in touch</h4>
              <div className="space-y-2">
                <a href="tel:07517658128" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 text-teal" /> 07517 658 128
                </a>
                <a href="mailto:esther.fair@eternal-fitness.co.uk" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 text-teal" /> esther.fair@eternal-fitness.co.uk
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/personal-training" className="hover:text-foreground transition-colors">Personal Training in Worthing</Link></li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Cancer Rehabilitation</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Exercise Referral</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Adaptive and Disability Training</li>
                <li className="hover:text-foreground transition-colors cursor-pointer">Injury Recovery</li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Information</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About Me</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/faqs" className="hover:text-foreground transition-colors">FAQs</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms and Conditions</Link></li>
              </ul>
            </div>

            {/* Follow */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Follow me</h4>
              <div className="flex gap-2 flex-wrap">
                <a
                  href="https://www.facebook.com/EternalFitnessPersonalTraining/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-teal/10 border border-teal/22 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://instagram.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-teal/10 border border-teal/22 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://linkedin.com/in/esther-fair/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-full bg-teal/10 border border-teal/22 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com/eternalfitness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-teal/10 border border-teal/22 flex items-center justify-center text-teal hover:bg-teal hover:text-white transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© 2026 Eternal Fitness · Esther Fair · Worthing, West Sussex</span>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms and Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
