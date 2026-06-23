"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CTASectionProps {
  onBookConsultation?: () => void;
}

const CTASection = ({ onBookConsultation }: CTASectionProps) => {
  return (
    <section className="relative overflow-hidden">
      <div className="grid md:grid-cols-2 min-h-[420px]">
        <div className="relative h-64 md:h-auto">
          <Image src="/images/studio-1.jpg" alt="Private personal training studio Worthing" fill className="object-cover" sizes="50vw" />
        </div>
        <div className="bg-rose flex items-center px-8 md:px-16 py-12 md:py-0">
          <div>
            <p className="ef-eyebrow ef-eyebrow-white mb-4">
              Free Consultation
            </p>
            <h2 className="text-4xl md:text-5xl text-white ef-h2 mb-5">
              Ready to Find Out If This Is Right for You?
            </h2>
            <p className="text-white/80 font-body text-base mb-8 max-w-md">
              The first conversation is free, there is no commitment, and there is no such thing as the wrong question. I work with a small number of clients at any one time — so every person gets my full attention.
            </p>
            <div className="flex flex-wrap gap-4">
              {onBookConsultation ? (
                <button onClick={onBookConsultation} className="inline-flex items-center gap-2 bg-white text-rose px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg">
                  Book a Free Consultation <ArrowUpRight className="w-4 h-4" />
                </button>
              ) : (
                <a href="/contact" className="inline-flex items-center gap-2 bg-white text-rose px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg">
                  Book a Free Consultation <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
              <a href="tel:07517658128" className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
                Give Me a Call <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
