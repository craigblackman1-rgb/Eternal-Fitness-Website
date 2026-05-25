"use client";

import { useState } from "react";
import { ArrowUpRight, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SocialIcon from "@/components/SocialIcons";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  agree: boolean;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  agree: false,
};

export default function ContactPageClient() {
  const [form, setForm] = useState<FormData>(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim()) {
      toast.error("Please enter your first name.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!form.message.trim()) {
      toast.error("Please enter a message.");
      return;
    }
    if (!form.agree) {
      toast.error("Please agree to the privacy policy before submitting.");
      return;
    }

    toast.success("Message sent! I will be in touch soon.");
    setForm(initialForm);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img
          src="/images/contact-hero.jpg"
          alt="Contact Eternal Fitness in Worthing"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay/65" />
        <div className="relative z-10 text-center max-w-3xl px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Get in Touch
          </h1>
          <p className="text-white/70 font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
            Whether you have a question, want to learn more, or are ready to book your free consultation — I would love to hear from you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#form"
                className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Send a Message <ArrowUpRight className="w-4 h-4" />
              </a>
            <a
              href="#map"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              Find the Studio
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section id="form" className="py-20 md:py-28 px-6 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-rose/10 text-rose px-4 py-1.5 rounded-full text-sm font-medium">
              ✦ Contact
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl text-foreground text-center mb-14">
            Send Me a Message
          </h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1.5">
                    First Name <span className="text-rose">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className="w-full px-4 py-3 rounded-xl border border-muted bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose/30"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1.5">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className="w-full px-4 py-3 rounded-xl border border-muted bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email <span className="text-rose">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-muted bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose/30"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="07xxx xxx xxx"
                  className="w-full px-4 py-3 rounded-xl border border-muted bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose/30"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                  Message <span className="text-rose">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell me a bit about yourself and what you are looking for..."
                  className="w-full px-4 py-3 rounded-xl border border-muted bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose/30 resize-none"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-muted accent-rose"
                />
                <label htmlFor="agree" className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <a href="/terms" className="text-rose underline hover:text-rose/80 transition-colors">
                    privacy policy
                  </a>{" "}
                  and consent to being contacted about my enquiry. <span className="text-rose">*</span>
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-rose text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity w-full justify-center"
              >
                Send Message <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Phone</h3>
                  <a href="tel:07517658128" className="text-muted-foreground font-body hover:text-teal transition-colors">
                    07517 658 128
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Email</h3>
                  <a href="mailto:esther.fair@eternal-fitness.co.uk" className="text-muted-foreground font-body hover:text-teal transition-colors">
                    esther.fair@eternal-fitness.co.uk
                  </a>
                </div>
              </div>

              {/* Studio Location */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium mb-1">Studio Location</h3>
                  <p className="text-muted-foreground font-body">Worthing, West Sussex</p>
                  <p className="text-muted-foreground/70 font-body text-sm mt-1">
                    Exact address shared after booking confirmation.
                  </p>
                </div>
              </div>

              {/* Not sure where to start? */}
              <div className="bg-white border border-muted rounded-2xl p-6 mt-4">
                <h3 className="text-foreground font-medium mb-2">Not sure where to start?</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed mb-4">
                  That is completely normal. Send me a message or give me a call and we can have an informal chat — no pressure, no commitment. I will help you figure out whether personal training is the right next step.
                </p>
                <a
                  href="tel:07517658128"
                  className="inline-flex items-center gap-2 text-rose font-medium text-sm hover:underline"
                >
                  Call me now <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Social Icons */}
              <div>
                <h3 className="text-foreground font-medium mb-3">Follow Me</h3>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=61576413498498"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center text-rose hover:bg-rose/20 transition-colors"
                    aria-label="Facebook"
                  >
                    <SocialIcon name="facebook" />
                  </a>
                  <span
                    className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/40 cursor-default"
                    title="Instagram — coming soon"
                    aria-label="Instagram — coming soon"
                  >
                    <SocialIcon name="instagram" />
                  </span>
                  <span
                    className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/40 cursor-default"
                    title="YouTube — coming soon"
                    aria-label="YouTube — coming soon"
                  >
                    <SocialIcon name="youtube" />
                  </span>
                  <span
                    className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/40 cursor-default"
                    title="TikTok — coming soon"
                    aria-label="TikTok — coming soon"
                  >
                    <SocialIcon name="tiktok" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="py-20 md:py-28 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-rose/10 text-rose px-4 py-1.5 rounded-full text-sm font-medium">
              ✦ Location
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl text-foreground text-center mb-6">
            Find the Studio
          </h2>
          <p className="text-muted-foreground font-body text-center max-w-xl mx-auto mb-12">
            Based in Worthing, West Sussex. The private studio is easily accessible by car and public transport.
          </p>
          <div className="rounded-2xl overflow-hidden border border-muted shadow-sm">
            <iframe
              title="Eternal Fitness location in Worthing, West Sussex"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d40625.88654390968!2d-0.4005!3d50.8148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4875a3a3a3a3a3a3%3A0x0!2sWorthing%2C+West+Sussex!5e0!3m2!1sen!2suk!4v1700000000000!5m2!1sen!2suk"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
