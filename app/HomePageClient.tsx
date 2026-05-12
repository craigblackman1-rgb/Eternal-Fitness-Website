"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhySection from "@/components/WhySection";
import SpecialiseSection from "@/components/SpecialiseSection";
import ApproachSection from "@/components/ApproachSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhoSection from "@/components/WhoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";

export default function HomePageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBookConsultation={openDialog} />
      <HeroSection onBookConsultation={openDialog} />
      <WhySection />
      <SpecialiseSection />
      <ApproachSection />
      <HowItWorksSection />
      <WhoSection />
      <TestimonialsSection />
      <CTASection onBookConsultation={openDialog} />
      <Footer />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
