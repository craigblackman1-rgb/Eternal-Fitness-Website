"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const tocItems = [
  { id: "what-are-cookies", label: "What are cookies?" },
  { id: "why-cookies", label: "Why do we use cookies?" },
  { id: "control-cookies", label: "How can I control cookies?" },
  { id: "essential-cookies", label: "Essential website cookies" },
  { id: "analytics-cookies", label: "Analytics and customization cookies" },
  { id: "unclassified-cookies", label: "Unclassified cookies" },
  { id: "tracking-technologies", label: "Other tracking technologies" },
  { id: "flash-cookies", label: "Flash cookies" },
  { id: "targeted-advertising", label: "Targeted advertising" },
  { id: "policy-updates", label: "Policy updates" },
  { id: "further-information", label: "Further information" },
];

export default function CookiesPolicyClient() {
  const [activeId, setActiveId] = useState("what-are-cookies");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );
    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <img src="/images/coaching-bicep-client.jpg" alt="Cookies Policy — Eternal Fitness Worthing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/70" />
        <div className="relative z-10 text-center max-w-2xl px-6">
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4">Cookie Policy</h1>
          <p className="text-white/70 font-body text-lg mb-8">
            This Cookie Policy explains how Eternal Fitness uses cookies and similar technologies when you visit our website.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/contact" className="inline-flex items-center gap-2 bg-teal text-white px-7 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
              Book a Free Consultation
            </a>
            <a href="#what-are-cookies" className="inline-flex items-center gap-2 border border-white/40 text-white px-7 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
              Read the Policy
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[260px_1fr] gap-12 items-start">
          {/* Sidebar TOC */}
          <aside className="md:sticky md:top-24">
            <h3 className="text-foreground text-lg mb-4">Table of Contents</h3>
            <nav className="flex flex-col gap-1">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                    activeId === item.id
                       ? "bg-rose text-white font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="prose-sm max-w-none space-y-12">
            <p className="text-muted-foreground text-sm">Last updated: December 06, 2020</p>

            <div id="what-are-cookies">
              <h2 className="text-2xl text-foreground mb-3">What are cookies?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                Cookies set by the website owner (in this case, Eternal Fitness) are called &ldquo;first party cookies&rdquo;. Cookies set by parties other than the website owner are called &ldquo;third party cookies&rdquo;.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                Third party cookies enable third party features or functionality to be provided on or through the website (e.g. advertising, interactive content and analytics). The parties that set these third party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
              </p>
            </div>

            <div id="why-cookies">
              <h2 className="text-2xl text-foreground mb-3">Why do we use cookies?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                We use first and third party cookies for several reasons. Some cookies are required for technical reasons in order for our Websites to operate, and we refer to these as &ldquo;essential&rdquo; or &ldquo;strictly necessary&rdquo; cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                Third parties serve cookies through our Websites for advertising, analytics and other purposes. This is described in more detail below.
              </p>
            </div>

            <div id="control-cookies">
              <h2 className="text-2xl text-foreground mb-3">How can I control cookies?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies. As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser&apos;s help menu for more information.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                In addition, most advertising networks offer you a way to opt out of targeted advertising.
              </p>
            </div>

            <div id="essential-cookies">
              <h2 className="text-2xl text-foreground mb-3">Essential website cookies</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-4">
                These cookies are strictly necessary to provide you with services available through our Websites and to use some of its features, such as access to secure areas.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left text-foreground font-medium px-4 py-3">Name</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Purpose</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Provider</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Type</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">__tlbcpv</td>
                      <td className="px-4 py-3">Used to record unique visitor views of the consent banner.</td>
                      <td className="px-4 py-3">.termly.io</td>
                      <td className="px-4 py-3">http_cookie</td>
                      <td className="px-4 py-3">1 year</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">__cfduid</td>
                      <td className="px-4 py-3">Used by Cloudflare to identify individual clients behind a shared IP address, and apply security settings on a per-client basis.</td>
                      <td className="px-4 py-3">.termly.io</td>
                      <td className="px-4 py-3">server_cookie</td>
                      <td className="px-4 py-3">30 days</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">TERMLY_API_CACHE</td>
                      <td className="px-4 py-3">Used to store visitor&apos;s consent result in order to improve performance of the consent banner.</td>
                      <td className="px-4 py-3">www.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">html_local_storage</td>
                      <td className="px-4 py-3">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div id="analytics-cookies">
              <h2 className="text-2xl text-foreground mb-3">Analytics and customization cookies</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-4">
                These cookies collect information that is used either in aggregate form to help us understand how our Websites are being used or how effective our marketing campaigns are, or to help us customize our Websites for you.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left text-foreground font-medium px-4 py-3">Name</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Purpose</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Provider</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Type</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">_ga</td>
                      <td className="px-4 py-3">Records a particular ID used to come up with data about website usage by the user.</td>
                      <td className="px-4 py-3">.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">http_cookie</td>
                      <td className="px-4 py-3">1 year 11 months 29 days</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">_gat#</td>
                      <td className="px-4 py-3">Enables Google Analytics to regulate the rate of requesting.</td>
                      <td className="px-4 py-3">.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">http_cookie</td>
                      <td className="px-4 py-3">1 minute</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">_gid</td>
                      <td className="px-4 py-3">Keeps an entry of unique ID which is then used to come up with statistical data on website usage by visitors.</td>
                      <td className="px-4 py-3">.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">http_cookie</td>
                      <td className="px-4 py-3">1 day</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div id="unclassified-cookies">
              <h2 className="text-2xl text-foreground mb-3">Unclassified cookies</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-4">
                These are cookies that have not yet been categorized. We are in the process of classifying these cookies with the help of their providers.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left text-foreground font-medium px-4 py-3">Name</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Provider</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Type</th>
                      <th className="text-left text-foreground font-medium px-4 py-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">elementor</td>
                      <td className="px-4 py-3">www.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">html_local_storage</td>
                      <td className="px-4 py-3">Persistent</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs">_ga_B4ZDEPQCR9</td>
                      <td className="px-4 py-3">.eternal-fitness.co.uk</td>
                      <td className="px-4 py-3">http_cookie</td>
                      <td className="px-4 py-3">1 year 11 months 29 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div id="tracking-technologies">
              <h2 className="text-2xl text-foreground mb-3">What about other tracking technologies, like web beacons?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called &ldquo;tracking pixels&rdquo; or &ldquo;clear gifs&rdquo;). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our Websites or opened an e-mail including them.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                This allows us, for example, to monitor the traffic patterns of users from one page within a website to another, to deliver or communicate with cookies, to understand whether you have come to the website from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.
              </p>
            </div>

            <div id="flash-cookies">
              <h2 className="text-2xl text-foreground mb-3">Do you use Flash cookies or Local Shared Objects?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                Websites may also use so-called &ldquo;Flash Cookies&rdquo; (also known as Local Shared Objects or &ldquo;LSOs&rdquo;) to, among other things, collect and store information about your use of our services, fraud prevention and for other site operations.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player to block Flash Cookies storage using the tools contained in the Website Storage Settings Panel. You can also control Flash Cookies by going to the Global Storage Settings Panel and following the instructions.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies may reduce or impede the functionality of some Flash applications, including, potentially, Flash applications used in connection with our services or online content.
              </p>
            </div>

            <div id="targeted-advertising">
              <h2 className="text-2xl text-foreground mb-3">Do you serve targeted advertising?</h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-3">
                Third parties may serve cookies on your computer or mobile device to serve advertising through our Websites. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                They may also employ technology that is used to measure the effectiveness of advertisements. This can be accomplished by them using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details or other details that directly identify you unless you choose to provide these.
              </p>
            </div>

            <div id="policy-updates">
              <h2 className="text-2xl text-foreground mb-3">How often will you update this Cookie Policy?</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies. The date at the top of this Cookie Policy indicates when it was last updated.
              </p>
            </div>

            <div id="further-information">
              <h2 className="text-2xl text-foreground mb-3">Where can I get further information?</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                If you have any questions about our use of cookies or other technologies, please email us at{" "}
                <a href="mailto:esther.fair@eternal-fitness.co.uk" className="text-rose hover:underline">
                  esther.fair@eternal-fitness.co.uk
                </a>{" "}
                or call us on{" "}
                <a href="tel:+4407517658128" className="text-rose hover:underline">
                  (+44) 07517 658128
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
