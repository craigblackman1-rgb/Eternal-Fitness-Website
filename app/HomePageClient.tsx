"use client";

import Image from "next/image";
import Link from "next/link";
import ConsultationDialog from "@/components/ConsultationDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeMotion from "@/components/home/HomeMotion";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";
import { IconAward, IconHeartHandshake } from "@/components/icons";
import "./home.css";

const Arrow = () => (
  <svg className="ico" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HomePageClient() {
  const { open, setOpen, openDialog } = useConsultationDialog();

  return (
    <div className="efhome">
      <Navbar onBookConsultation={openDialog} />

      {/* HERO */}
      <section id="hero">
        <div className="hlp">
          <div className="h-tag" id="htag">Worthing, West Sussex</div>
          <div style={{ marginBottom: 24 }}>
            <div className="hw"><span className="hl hl-t" id="hl1">Exercise</span></div>
            <div className="hw"><span className="hl hl-b" id="hl2">for Health</span></div>
            <div className="hw"><span className="hl hl-t" id="hl3">Conditions</span></div>
          </div>
          <p className="h-loc" id="hloc">Private one-to-one personal training in Worthing</p>
          <p className="h-sub" id="hsub">
            Specialist training for people with health conditions, complex needs, and anyone the
            mainstream fitness industry has overlooked. Every session adapts to how you feel that
            day — because the same plan can be right one week and wrong the next.
            GP-referred clients welcome.
          </p>
          <div className="h-btns" id="hbtns">
            <button className="btn btn-dk" onClick={openDialog}>Book a Free Consultation <Arrow /></button>
            <a href="#why" className="btn btn-ol">Find Out How It Works</a>
          </div>
        </div>
        <div className="hrp" style={{ padding: 0 }}>
          <Image
            src="/images/esther-main.jpg"
            alt="Esther Fair — Level 4 Personal Trainer, Worthing"
            fill
            priority
            sizes="(max-width: 1000px) 100vw, 45vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
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
            I am always watching and always adapting. Every session starts with a check-in — energy
            levels, pain, sleep, what&apos;s changed since last week. The plan for that day is set then,
            not before you walk through the door.
          </p>
          <div className="steps">
            <div className="step">
              <div className="sn">01</div>
              <div className="sc"><h3>Every session adapts to how you feel that day</h3><p>Fatigue, flares, bad nights, medication changes — I notice and adjust without drawing attention to it. You always leave feeling you&apos;ve done something worthwhile.</p></div>
              <div className="si"><Image src="/images/esther-training.jpg" alt="Esther Fair adapting a training session in Worthing" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
            <div className="step">
              <div className="sn">02</div>
              <div className="sc"><h3>Private 1-to-1 studio — no gym floor</h3><p>No other clients. No performance pressure. No dress code. A calm, private space where the only focus is you and what you need today.</p></div>
              <div className="si"><Image src="/images/studio-2.jpg" alt="Private personal training studio in Worthing" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
            <div className="step">
              <div className="sn">03</div>
              <div className="sc"><h3>Functional progress — not transformation</h3><p>Climbing stairs with less pain. Better sleep. More energy. Walking further. These are the outcomes that matter to the people I work with — and they&apos;re the ones I build towards.</p></div>
              <div className="si"><Image src="/images/studio-1.jpg" alt="Long-term sustainable training in Worthing" fill sizes="(max-width: 1000px) 100vw, 360px" style={{ objectFit: "cover" }} /></div>
            </div>
          </div>
          <div className="aq-g">
            <div className="aq"><div className="aq-ic"><IconAward className="w-5 h-5" /></div><h4>Level 4 qualified — the highest mainstream PT certification in the UK</h4><p>Exercise Referral Specialist and Cancer Rehabilitation Specialist. Trained to work with GP-referred clients, chronic conditions, post-treatment recovery, and complex medical needs. Most PTs are not qualified for this work.</p></div>
            <div className="aq"><div className="aq-ic"><IconHeartHandshake className="w-5 h-5" /></div><h4>No weigh-ins. No judgement. No agenda.</h4><p>No before-and-after framing, no expectations about what fitness should look like. The goal is what matters to you — whether that&apos;s managing pain, regaining independence, or simply moving with more confidence.</p></div>
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
            <Link href="/cancer-rehabilitation" className="spc"><div className="spc-img"><Image src="/images/esther-training.jpg" alt="Cancer rehabilitation training in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">01</div><div className="spc-t">Cancer Rehabilitation</div><div className="spc-d">Specialist support during treatment, in remission, and post-surgery.</div></Link>
            <Link href="/exercise-for-health" className="spc"><div className="spc-img"><Image src="/images/studio-2.jpg" alt="Exercise for health conditions in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">02</div><div className="spc-t">Exercise for Health</div><div className="spc-d">Blood pressure, diabetes, bone strength, mobility and more — exercise referral specialists.</div></Link>
            <Link href="/exercise-for-health/visual-impairment" className="spc"><div className="spc-img"><Image src="/images/studio-1.jpg" alt="Personal training for visually impaired clients in Worthing" fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} /></div><div className="spc-n">03</div><div className="spc-t">Visual Impairment</div><div className="spc-d">Adapted training for people who are blind or partially sighted.</div></Link>
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
