"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import ConsultationDialog from "@/components/ConsultationDialog";
import EternalFitnessLogo from "@/components/EternalFitnessLogo";
import Footer from "@/components/Footer";
import HeroCanvas from "@/components/home/HeroCanvas";
import HomeMotion from "@/components/home/HomeMotion";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import "./home.css";

const Arrow = () => (
  <svg className="ico" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const navItems = [
  { label: "About", to: "/about" },
  { label: "How It Works", to: "#approach" },
  { label: "Specialist Areas", to: "#specialist" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQs", to: "/faqs" },
];

export default function HomePageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const [lit, setLit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setLit(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="efhome">
      {/* NAV */}
      <nav id="nav" className={lit || menuOpen ? "lit" : ""}>
        <Link href="/" aria-label="Eternal Fitness home">
          <EternalFitnessLogo variant={lit || menuOpen ? "dark" : "light"} className="h-7 w-auto" />
        </Link>
        <div className="nlinks hidden md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.to} className="nlink">{item.label}</Link>
          ))}
        </div>
        <button className="ncta btn hidden md:inline-flex" onClick={openDialog}>
          Book Consultation <Arrow />
        </button>
        <button
          className="nburger btn md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed", top: 72, left: 0, right: 0, zIndex: 999,
            background: "#fff", borderBottom: "1px solid #E4DDD7",
            padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          {navItems.map((item) => (
            <Link key={item.label} href={item.to} className="nlink" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* HERO */}
      <section id="hero">
        <div className="hlp">
          <div className="h-tag" id="htag">Worthing, West Sussex</div>
          <div style={{ marginBottom: 24 }}>
            <div className="hw"><span className="hl hl-t" id="hl1">Rehabilitation</span></div>
            <div className="hw"><span className="hl hl-b" id="hl2">and Recovery</span></div>
            <div className="hw"><span className="hl hl-t" id="hl3">Training</span></div>
          </div>
          <p className="h-loc" id="hloc">in Worthing for Complex Health Needs</p>
          <p className="h-sub" id="hsub">
            Specialist one-to-one training for cancer rehabilitation, chronic health conditions,
            post-surgery recovery, mobility limitations, disabilities, and anyone with complex
            medical needs who has been overlooked by mainstream fitness. GP-referred clients welcome.
          </p>
          <div className="h-btns" id="hbtns">
            <button className="btn btn-dk" onClick={openDialog}>Book a Free Consultation <Arrow /></button>
            <a href="#why" className="btn btn-ol">Find Out How It Works</a>
          </div>
        </div>
        <div className="hrp">
          <HeroCanvas />
          <div className="h-badge" id="hbadge">
            <div className="hbc">4</div>
            <div>
              <div className="hbt">Level 4 Qualified</div>
              <div className="hbs">The highest PT qualification in the UK — plus cancer rehab and exercise referral</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="tstrip">
        <div className="ttrack">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "flex" }}>
              <span className="ti">Level 4 Personal Trainer</span><span className="ti ts">✦</span>
              <span className="ti">Cancer Rehabilitation Specialist</span><span className="ti ts">✦</span>
              <span className="ti">Exercise Referral Specialist</span><span className="ti ts">✦</span>
              <span className="ti">GP-Referred Clients Welcome</span><span className="ti ts">✦</span>
              <span className="ti">Private One-to-One Studio</span><span className="ti ts">✦</span>
              <span className="ti">Based in Worthing</span><span className="ti ts">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* WHY */}
      <section id="why" className="sec" style={{ background: "var(--white)" }}>
        <div className="sin">
          <div className="why-g">
            <div className="wic">
              <div className="wimg">
                <Image src="/images/esther-training.jpg" alt="Training for complex health conditions in Worthing" fill sizes="(max-width: 1000px) 100vw, 40vw" style={{ objectFit: "cover" }} />
              </div>
              <div className="wbadge"><div className="wbn">GP</div><div className="wbl">Referred Clients Welcome</div></div>
            </div>
            <div>
              <div className="stag stag-r">Why Eternal Fitness</div>
              <h2 className="D" style={{ marginBottom: 16 }}>Training That Meets<br />You Where You Are</h2>
              <p className="L">
                Esther Fair is a Level 4 personal trainer, Exercise Referral Specialist, and Cancer
                Rehabilitation Specialist based in Worthing. She specialises in rehabilitation and
                recovery training for cancer treatment survivors, chronic health conditions,
                post-surgery recovery, disabilities, and anyone with complex medical needs who has
                been overlooked by mainstream fitness.
              </p>
              <div className="wfeats">
                <div className="wf"><div className="wfd" /><div><div className="wft">Specialist in complex health conditions</div><div className="wfc">Cancer rehabilitation, chronic illness, neurological conditions, post-surgical recovery, mobility limitations.</div></div></div>
                <div className="wf"><div className="wfd" /><div><div className="wft">Strength and mobility for real life</div><div className="wfc">Building functional strength that improves everyday movement, independence, and confidence.</div></div></div>
                <div className="wf"><div className="wfd" /><div><div className="wft">Calm, private, one-to-one training</div><div className="wfc">A private studio with no gym floor, no other clients, no pressure to look or perform.</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO */}
      <section id="who" className="sec" style={{ background: "var(--ink)" }}>
        <div className="sin">
          <div className="stag stag-w">Who This Is For</div>
          <h2 className="D DL" style={{ maxWidth: 700 }}>If You Have Been Told<br />Fitness Is Not for You — It Is</h2>
          <p className="L LL" style={{ marginTop: 16, maxWidth: 540 }}>
            I have worked with clients managing cancer, chronic illness, disability, visual impairment,
            neurological conditions, and complex mobility issues. I am here for the people other
            trainers cannot help.
          </p>
          <div className="who-g">
            <div className="wc">
              <div className="wci"><Image src="/images/who-health.jpg" alt="Training with health conditions in Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} /></div>
              <div className="wcb">
                <h3>People managing health conditions, disability, or injury</h3>
                <p>Cancer rehabilitation. Chronic illness. Neurological conditions. Post-surgical recovery. Extreme mobility limitations. Level 4 qualified and exercise referral trained — I know how to work safely and effectively with complex needs.</p>
                <Link href="/personal-training" className="btn btn-rs" style={{ fontSize: "13.5px", padding: "11px 20px" }}>See Specialist Areas <Arrow /></Link>
              </div>
            </div>
            <div className="wc">
              <div className="wci"><Image src="/images/who-mobility.jpg" alt="Inclusive personal training in Worthing" fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} /></div>
              <div className="wcb">
                <h3>People who have never felt welcome in fitness spaces</h3>
                <p>Whether you are a complete beginner, have had negative experiences elsewhere, or simply find gyms intimidating — the private, one-to-one format at Eternal Fitness is designed to feel completely different. No dress code, no weigh-in, no comparison to anyone else.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPROACH */}
      <section id="approach" className="sec" style={{ background: "var(--cream)" }}>
        <div className="sin">
          <div style={{ maxWidth: 640, marginBottom: 12 }}>
            <div className="stag stag-f">The Approach</div>
            <h2 className="D">This Is Not Like<br />Other Personal Training</h2>
          </div>
          <p className="L" style={{ maxWidth: 560 }}>
            A Cancer Rehabilitation Specialist and Exercise Referral Specialist trained to adapt to
            medical conditions, medication side-effects, fatigue variability, and changing capacity.
            I work alongside your GP, specialist, or physiotherapist — not against them.
          </p>
          <div className="steps">
            <div className="step">
              <div className="sn">01</div>
              <div className="sc"><h3>Private 1-to-1 studio</h3><p>No gym floor. No other clients. No pressure to look or perform a certain way.</p></div>
              <div className="si"><Image src="/images/approach-private.jpg" alt="Private one-to-one studio" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
            <div className="step">
              <div className="sn">02</div>
              <div className="sc"><h3>Adapts when your medical situation changes</h3><p>Fatigue flares. Conditions fluctuate. Side effects vary. Your programme adjusts with your body — always.</p></div>
              <div className="si"><Image src="/images/approach-flexible.jpg" alt="Programme adapts to your situation" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
            <div className="step">
              <div className="sn">03</div>
              <div className="sc"><h3>Long-term over quick fixes</h3><p>Real results come from steady, sustainable progress — not six-week transformations.</p></div>
              <div className="si"><Image src="/images/approach-consistency.jpg" alt="Long-term sustainable progress" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
          </div>
          <div className="aq-g">
            <div className="aq"><h4>Qualified in cancer rehabilitation and clinical exercise</h4><p>Level 4 Personal Trainer, Exercise Referral Specialist, Cancer Rehabilitation Specialist. Trained to work with GP-referred clients, chronic conditions, post-treatment recovery, and complex medical needs — rare qualifications in any fitness setting.</p></div>
            <div className="aq"><h4>No judgement. No agenda.</h4><p>No weigh-ins, no before-and-after photos, no expectation of what fitness should look like. Just you and me, and a programme built for your body.</p></div>
          </div>
        </div>
      </section>

      {/* SPECIALIST */}
      <section id="specialist" className="sec" style={{ background: "var(--white)" }}>
        <div className="sin">
          <div className="spec-h">
            <div><div className="stag stag-r">Specialist Areas</div><h2 className="D">Who I Work With</h2></div>
            <p className="L">
              Cancer rehabilitation (active treatment, in remission, post-surgery). Chronic health
              conditions (fibromyalgia, ME/CFS, autoimmune, diabetes, heart conditions). Disability
              and adaptive training. Neurological conditions. GP-referred programmes. If your situation
              is not listed — please still get in touch. The answer is almost always yes.
            </p>
          </div>
          <div className="spec-g">
            <div className="spc"><div className="spc-img"><Image src="/images/specialise-1.jpg" alt="Cancer rehabilitation training in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">01</div><div className="spc-t">Cancer Rehabilitation</div><div className="spc-d">Specialist support during treatment, in remission, and post-surgery.</div></div>
            <div className="spc"><div className="spc-img"><Image src="/images/specialise-2.jpg" alt="Adaptive personal training in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">02</div><div className="spc-t">Adaptive Training</div><div className="spc-d">Inclusive programmes tailored to your abilities and goals.</div></div>
            <div className="spc"><div className="spc-img"><Image src="/images/specialise-3.jpg" alt="Injury recovery training in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">03</div><div className="spc-t">Injury Recovery</div><div className="spc-d">Safe, structured return to movement after injury or surgery.</div></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="sec" style={{ background: "var(--teal)" }}>
        <div className="sin">
          <div className="twrap">
            <div className="tmark">&ldquo;</div>
            <p className="tquote">
              I was so nervous about starting, but from the first session Esther put me at ease. She
              listened, adapted everything to my condition, and I have never felt stronger or more
              confident in my own body.
            </p>
            <div className="tauth"><div className="tav">M</div><div><div className="tnm">Mary C</div><div className="tlo">Worthing</div></div></div>
            <div className="tdiv" />
            <div className="tsec">
              <p>&ldquo;As someone who has dealt with chronic pain for years, I was sceptical that exercise could help. The personalised approach at Eternal Fitness has genuinely changed my quality of life. I cannot recommend it enough.&rdquo;</p>
              <div className="tsec-a">Angela M · West Sussex</div>
            </div>
            <div style={{ marginTop: 52 }}>
              <div className="stag stag-w" style={{ justifyContent: "center", marginBottom: 14 }}>Client Stories</div>
              <p className="L LL" style={{ maxWidth: 520, margin: "0 auto 26px", textAlign: "center" }}>
                Progress looks different for everyone. For some it is lifting more, for others it is
                walking without pain, sleeping better, or simply feeling at home in their own body.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Link href="/faqs" className="btn btn-ow">Read the FAQs <Arrow /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="ctabg"><Image src="/images/studio-1.jpg" alt="Eternal Fitness private studio in Worthing" fill sizes="100vw" style={{ objectFit: "cover" }} /></div>
        <div className="ctac">
          <div className="stag stag-w" style={{ marginBottom: 16 }}>Free Consultation</div>
          <h2>Ready to find out if this is right for you?</h2>
          <p>The first conversation is free, with no commitment. I work with a small number of clients at a time — so every person gets my full attention.</p>
          <div className="ctabtns">
            <button className="btn btn-wh" onClick={openDialog}>Book a Free Consultation</button>
            <a href="tel:07517658128" className="btn btn-ow">Call: 07517 658 128</a>
          </div>
        </div>
      </section>

      <Footer />

      <HomeMotion />
      <ConsultationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
