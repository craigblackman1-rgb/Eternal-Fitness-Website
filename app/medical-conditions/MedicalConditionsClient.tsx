"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BOOKINGS_URL } from "@/lib/booking";
import {
  Section,
  SectionHeading,
  PageHero,
  FeatureBand,
  StatBadge,
  CTABand,
  Callout,
  Reveal,
  CtaButton,
  FaqSplit,
} from "@/components/ds";
import { IconRibbon } from "@/components/icons";


export default function MedicalConditionsClient() {
  const howIWork = [
    { title: "Screened properly", body: "Before we start I screen properly, and I\u2019m never worried about checking in with your GP or consultant. If you need medical clearance, we get it documented \u2014 \u201Cmy doctor said it\u2019s fine\u201D isn\u2019t enough to keep you safe." },
    { title: "The right questions", body: "Not \u201Cwhat\u2019s wrong with you?\u201D but \u201Cwhat have you been told to avoid?\u201D, \u201Cwhat does a bad day look like?\u201D and \u201Cwhat have you already tried?\u201D It\u2019s surprising how often someone is carrying a restriction that expired months ago." },
    { title: "A pause, not a ban", body: "If a condition is acute or unstable, exercise may need to stop for a while. That\u2019s normally a pause, not a permanent ban. Once things settle, it becomes about how, and how much." },
  ];

  const firstSession = [
    { title: "A proper baseline", body: "Your first session is a full assessment, so we know where you\u2019re starting from. Not testing you to failure \u2014 knowing your starting point is not the same as finding out what breaks you." },
    { title: "Leave feeling capable", body: "You should leave the first session feeling capable, not exhausted. If you leave wiped out, it only confirms what you were afraid of." },
    { title: "Adapted on the day, quietly", body: "Your plan adapts to how you feel on the day, without a fuss and without turning every change into a conversation about your condition." },
    { title: "No \u201Ceasier option\u201D", body: "An adjustment that lets you perform an exercise with better technique isn\u2019t falling short of anyone. It\u2019s the smarter way to get more from it." },
  ];

  const progress = [
    { title: "Sleeping better", body: "Often the first change people notice, long before anything shows on the scales." },
    { title: "More energy, less pain", body: "The everyday wins that make the rest of life easier." },
    { title: "Trust in your own body", body: "Rebuilt one session at a time, at a pace you can manage." },
  ];

  const faqs = [
    { title: "Do I need my GP\u2019s permission first?", body: "It depends on your condition and where you are with it. I screen everyone before we start, and if medical clearance is needed we get it documented. I\u2019m always happy to check in with your GP or consultant." },
    { title: "What if I have a bad day?", body: "Then the session adapts. Every session starts with a check-in, and the plan changes to match how you feel on the day. Being honest about a bad day never means being told you can\u2019t train." },
    { title: "What if you\u2019re not the right trainer for me?", body: "Then I\u2019ll tell you, and help you find who is. Sometimes that means splitting your programme with another specialist so you get the right expertise for each part." },
    { title: "I\u2019m not a \u201Cgym person\u201D. Is this for me?", body: "Very often, yes. Many of the people I work with never saw themselves as gym people. Training is one-to-one in a private studio in Worthing, so there are no busy gym floors and no one watching." },
  ];

  const bookCta = { label: "Book a Free Consultation", href: BOOKINGS_URL, arrow: true };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main-content">
      <PageHero
        image="/images/approach-step3-deadlift-clients.jpg"
        imageAlt="Esther and a client hinged forward side by side in the private Worthing studio, the client holding one small dumbbell and Esther running her hands down her own thighs to show the path the hinge takes."
        imageObjectPosition="55% 45%"
        imageObjectPositionWide="60% 40%"
        eyebrow={"Training With a Medical Condition"}
        heading={<>{"The Barrier Isn\u2019t"}<br />{"the Diagnosis"}</>}
        subhead={"One-to-one personal training in Worthing for people living with a medical condition \u2014 carrying a diagnosis, a lot of apprehension, or both. Screened properly, paced to you, and adapted to how you feel on the day."}
        primaryCta={bookCta}
        secondaryCta={{ label: "How I Work", href: "#how-i-work", variant: "ghost-white" }}
        badge={<StatBadge variant="rose" value="L4" label={"Exercise Referral & Cancer Rehab"} />}
      />

      {/* WHY IT STALLS */}
      <Section background="white">
        <div className="ds-split">
          <div>
            <SectionHeading
              eyebrow={"Why It Stalls"}
              eyebrowColor="teal"
              heading={"Nobody said no. But nobody said yes either."}
            />
            <Reveal y={24}>
              <p className="ds-body" style={{ marginTop: 20, marginBottom: 16 }}>
                {"Living with a medical condition doesn\u2019t mean you have to stop being active. But the fear of causing harm \u2014 for you and for the people who love you \u2014 often lingers. The old \u201Crest is best\u201D mentality is a comfortable thing to believe when you\u2019re frightened."}
              </p>
              <p className="ds-body" style={{ marginBottom: 16 }}>
                {"Medical professionals are understandably wary of advising the wrong thing, so exercise often never enters the conversation. When it isn\u2019t actively recommended, it\u2019s reasonable to assume it isn\u2019t for you."}
              </p>
              <p className="ds-body" style={{ marginBottom: 28 }}>
                {"And when your body feels like it has let you down, asking more of it is frightening. That isn\u2019t a motivation problem, and it isn\u2019t solved with a training plan alone. It takes time, and someone willing to go at a pace you can actually manage."}
              </p>
              <Callout
                icon={IconRibbon}
                accent="rose"
                title={"Qualified beyond standard personal training"}
                body={"GP Exercise Referral qualified, and Level 4 qualified in Cancer and Exercise Rehabilitation (CanRehab). Specialist training to work safely with complex, stable conditions."}
              />
              <div style={{ marginTop: 28 }}>
                <CtaButton cta={bookCta} />
              </div>
            </Reveal>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image
              src="/images/about-studio-band-stretch.jpg"
              alt="Esther and a client facing each other across the studio floor with one long resistance band held between them, Esther down in the same half-squat she is asking the client to hold."
              fill
              sizes="(max-width: 1000px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </Reveal>
        </div>
      </Section>

      {/* HOW I WORK */}
      <Section background="cream">
        <div id="how-i-work">
          <SectionHeading eyebrow={"How I Work"} heading={"Safe First. Then Confident."} />
        </div>
        <Reveal y={40} start="top 80%" style={{ marginTop: 40 }}>
          <FeatureBand
            accent="rose"
            items={howIWork.map((s) => ({ title: s.title, body: s.body }))}
          />
        </Reveal>
      </Section>

      {/* YOUR FIRST SESSION */}
      <Section background="white">
        <div className="ds-split">
          <div>
            <SectionHeading eyebrow={"Your First Session"} eyebrowColor="teal" heading={"A Starting Point, Not a Test"} />
            <div className="ds-featlist">
              {firstSession.map((c) => (
                <div key={c.title} className="ds-feat">
                  <span className="ds-feat-dot" />
                  <div>
                    <div className="ds-feat-t">{c.title}</div>
                    <div className="ds-feat-c">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Reveal y={40} className="ds-split-img">
            <Image src="/images/approach-step2-lunges-together.png" alt="Esther and a client side by side on the studio mats, both down in a half-kneeling lunge with a hand resting on the front thigh, Esther holding the same position alongside rather than watching from standing." fill sizes="(max-width: 1000px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Reveal>
        </div>
      </Section>

      {/* QUOTE */}
      <Section background="cream">
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <Callout
            icon={IconRibbon}
            accent="teal"
            title={"\u201CIf something isn\u2019t a big deal to me, it becomes less of a big deal to you.\u201D"}
            body={"Most people in your position have spent months being met with concern. Being met with something closer to normal is a relief \u2014 and it puts the say in what you\u2019re capable of back with you. \u2014 Esther"}
          />
        </div>
      </Section>

      {/* WHAT PROGRESS LOOKS LIKE */}
      <Section background="white">
        <SectionHeading eyebrow={"What Progress Looks Like"} heading={"Maintenance Is the Achievement"} />
        <p className="ds-body" style={{ maxWidth: 640, margin: "0 auto 40px", textAlign: "center" }}>
          {"When you\u2019re managing a condition there is no \u201Cafter\u201D photo. For a progressive or fluctuating condition, holding steady is a real achievement \u2014 sometimes the win is that the line didn\u2019t go down."}
        </p>
        <Reveal y={40} start="top 80%">
          <FeatureBand
            accent="teal"
            items={progress.map((s) => ({ title: s.title, body: s.body }))}
          />
        </Reveal>
      </Section>

      {/* HONEST ABOUT SCOPE */}
      <Section background="cream">
        <SectionHeading eyebrow={"Honest About Scope"} eyebrowColor="teal" heading={"If I\u2019m Not the Right Person, I\u2019ll Tell You Who Is"} />
        <Reveal y={24}>
          <p className="ds-body" style={{ maxWidth: 640, margin: "0 auto 16px", textAlign: "center" }}>
            {"My qualifications let me work with complex, stable conditions. They don\u2019t give me permission to train anyone through acute instability. If what you need sits outside my scope, I\u2019ll say so \u2014 as a redirection, not a rejection: \u201CI\u2019m not the right person for this, and here\u2019s who is.\u201D"}
          </p>
          <p className="ds-body" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            {"Not every referral has to be a handover, either. Sometimes a programme is best split by expertise \u2014 someone else takes the part that needs their qualification, and I keep mine. You don\u2019t lose a trainer. You gain a team."}
          </p>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section background="white">
        <FaqSplit
          eyebrow={"Common Questions"}
          heading={"Common Questions About Training With a Medical Condition"}
          intro={"If your question is not covered here, just ask \u2014 I would always rather you did."}
          accent="rose"
          cta={bookCta}
          items={faqs}
        />
      </Section>

      <CTABand
        image="/images/studio-kettlebell-playful.jpg"
        imageAlt="A relaxed moment with kettlebells in the Eternal Fitness studio"
        heading={"Ready to find out if this is right for you?"}
        body={"The first conversation is free, with no commitment. Tell me what you\u2019ve been told, what you\u2019ve tried, and what a bad day looks like \u2014 and we\u2019ll take it from there."}
        primaryCta={{ label: "Book a Free Consultation", href: BOOKINGS_URL }}
        secondaryCta={{ label: "Call: 07517 658 128", href: "tel:07517658128", variant: "ghost-white" }}
      />
      </main>
      <Footer />
    </div>
  );
}
