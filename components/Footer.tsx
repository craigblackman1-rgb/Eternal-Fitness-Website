import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import SocialIcon from "@/components/SocialIcons";
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

      <footer id="contact" className="bg-background border-t border-border py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="inline-block">
              <EternalFitnessLogo variant="dark" className="h-7 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm mt-3 mb-6 leading-relaxed">
              Private, one-to-one personal training in Worthing. Level 4 qualified. Exercise referral specialist. Cancer rehabilitation.
            </p>
            <div className="space-y-3">
              <h4 className="font-body font-semibold text-foreground text-base">Get in Touch</h4>
              <a href="tel:07517658128" className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                <Phone className="w-4 h-4 text-accent" /> 07517 658 128
              </a>
              <a href="mailto:esther.fair@eternal-fitness.co.uk" className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                <Mail className="w-4 h-4 text-accent" /> esther.fair@eternal-fitness.co.uk
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-body font-semibold text-foreground text-base mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/personal-training" className="hover:text-foreground transition-colors font-medium">Personal Training in Worthing</Link></li>
              <li>Cancer Rehabilitation</li>
              <li>Exercise Referral</li>
              <li>Adaptive and Disability Training</li>
              <li>Injury Recovery</li>
            </ul>
          </div>

          <div>
            <h4 className="font-body font-semibold text-foreground text-base mb-4">Information</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Me</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/faqs" className="hover:text-foreground transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms and Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-body font-semibold text-foreground text-base mb-4">Follow Me on Facebook</h4>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/EternalFitnessPersonalTraining/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Eternal Fitness on Facebook"
                className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <SocialIcon name="facebook" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>2026 Eternal Fitness | Esther Fair | Worthing, West Sussex</span>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms and Conditions</Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
