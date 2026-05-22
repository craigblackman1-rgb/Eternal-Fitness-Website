"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  FileText,
  Globe,
  MapPin,
  Target,
  Clock,
  BarChart3,
  Zap,
  ArrowRight,
  Code,
} from "lucide-react";

function PriorityBadge({ level }: { level: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`rounded-full text-xs font-semibold ${map[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: "pass" | "warn" | "fail" | "critical" }) {
  const map = {
    pass: { icon: <CheckCircle className="w-3.5 h-3.5" />, text: "Pass", cls: "bg-green-100 text-green-700 border-green-200" },
    warn: { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    fail: { icon: <XCircle className="w-3.5 h-3.5" />, text: "Issue", cls: "bg-red-100 text-red-700 border-red-200" },
    critical: { icon: <XCircle className="w-3.5 h-3.5" />, text: "Critical", cls: "bg-red-100 text-red-800 border-red-300" },
  };
  const { icon, text, cls } = map[status];
  return (
    <Badge variant="outline" className={`rounded-full text-xs font-semibold gap-1 ${cls}`}>
      {icon} {text}
    </Badge>
  );
}

function OptBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-teal" : score >= 60 ? "bg-amber" : "bg-rose";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-off-white overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold w-8">{score}%</span>
    </div>
  );
}

function IssueCard({ title, impact, description, fix }: { title: string; impact: "critical" | "high" | "medium" | "low"; description: string; fix: string }) {
  const border = { critical: "border-l-red-600", high: "border-l-rose", medium: "border-l-amber", low: "border-l-teal" };
  return (
    <Card className={`border-l-4 ${border[impact]} shadow-sm`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{title}</h4>
          <PriorityBadge level={impact} />
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="bg-off-white/60 rounded-lg p-3 text-xs">
          <span className="font-semibold text-teal">Fix: </span>{fix}
        </div>
      </CardContent>
    </Card>
  );
}

const auditDate = "21 May 2026";
const siteUrl = "staging.eternal-fitness.co.uk";

export default function SEOAuditPage() {
  const [tab, setTab] = useState("executive");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SEO Audit</h1>
          <p className="text-muted-foreground mt-1">{siteUrl} &middot; Audited {auditDate} &middot; Next.js 14 + Vercel</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1 rounded-full"><Code className="w-3 h-3" /> Next.js 14</Badge>
          <Badge variant="outline" className="gap-1 rounded-full"><Globe className="w-3 h-3" /> Vercel</Badge>
          <Badge variant="outline" className="gap-1 rounded-full"><Search className="w-3 h-3" /> Custom metadata</Badge>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Overall Health", score: "B-", color: "text-amber", icon: <BarChart3 className="w-5 h-5" /> },
          { label: "Technical SEO", score: "A-", color: "text-teal", icon: <Globe className="w-5 h-5" /> },
          { label: "On-Page SEO", score: "A", color: "text-teal", icon: <FileText className="w-5 h-5" /> },
          { label: "Content Quality", score: "A", color: "text-teal", icon: <Target className="w-5 h-5" /> },
          { label: "Schema & Structured Data", score: "A-", color: "text-teal", icon: <Target className="w-5 h-5" /> },
          { label: "Local SEO", score: "B+", color: "text-teal", icon: <MapPin className="w-5 h-5" /> },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm border-border/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-off-white flex items-center justify-center text-muted-foreground shrink-0">
                {s.icon}
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.score}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-1 overflow-x-auto flex-nowrap">
          {["executive", "technical", "onpage", "keywords", "content", "local", "action"].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-full px-4 py-2 text-xs font-medium data-[state=active]:bg-rose data-[state=active]:text-white data-[state=active]:shadow-sm whitespace-nowrap"
            >
              {
                {
                  executive: "Executive Summary",
                  technical: "Technical SEO",
                  onpage: "On-Page SEO",
                  keywords: "Keywords Per Page",
                  content: "Content Audit",
                  local: "Local SEO",
                  action: "Action Plan",
                }[t]
              }
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ==================== EXECUTIVE SUMMARY ==================== */}
        <TabsContent value="executive" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber" /> Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>This is a <strong className="text-foreground">Next.js 14 rebuild</strong> of the old WordPress site — and it is a massive improvement. The content is excellent, the brand voice is on point, the site structure is clean, and the technical implementation is solid.</p>
              <p>However, there is one <strong className="text-red-600">critical issue</strong> that must be fixed before launch: <strong className="text-red-600">every page has <code>noindex, nofollow</code></strong> meta tags. This means Google cannot index any page on the site. Once this is removed, the site will be in excellent shape.</p>
            </CardContent>
          </Card>

          <h3 className="text-lg font-bold mt-6">Top 5 Priority Issues</h3>

          <IssueCard
            title="CRITICAL: All Pages Have noindex, nofollow"
            impact="critical"
            description='Every single page on the staging site has <meta name="robots" content="noindex, nofollow" />. This is likely intentional for staging but MUST be removed before the site goes live. Without this fix, the site will not appear in Google at all.'
            fix="Remove noindex/nofollow from the metadata configuration. In Next.js, this is typically in the root layout.tsx metadata export or a shared metadata config. Ensure production builds use 'index, follow'."
          />
          <IssueCard
            title="Blog Posts Still Show Craig Blackman as Author"
            impact="high"
            description="All 27 blog posts have 'Craig Blackman' as the author in both the visible byline and the Article schema. This damages E-E-A-T — content should be attributed to Esther Fair, the Level 4 PT who actually delivers the service."
            fix="Update the blog post data source to use Esther Fair as the author. Update the Article schema author field. This is a data/content change, not a code change."
          />
          <IssueCard
            title="Blog Content Stale — No New Posts Since August 2022"
            impact="high"
            description="All 27 blog posts are from October 2021 - August 2022. The content has been migrated from the old WordPress site but nothing new has been added. Google favours sites that publish regularly."
            fix="Publish 2-4 new blog posts per month targeting clinical fitness topics (cancer rehab exercise, exercise referral, menopause training, adaptive fitness, long COVID)."
          />
          <IssueCard
            title="Canonical URLs Use eternalfitness.co.uk (No Hyphen)"
            impact="medium"
            description="Canonical URLs point to eternalfitness.co.uk (without hyphen) but the live domain is eternal-fitness.co.uk (with hyphen). This could cause canonical mismatch issues when the site goes live."
            fix="Update the canonical URL base in the metadata configuration to use eternal-fitness.co.uk (with hyphen). Verify the actual live domain matches."
          />
          <IssueCard
            title="Privacy Policy Is Outdated (2020) and References California"
            impact="medium"
            description='The privacy policy is dated "December 06, 2020" and includes a section on "California residents\' rights" which is irrelevant for a UK-based business. It also references cookie policy at /cookies-policy which may not exist on the new site.'
            fix="Update the privacy policy with current date, remove California section, add UK GDPR-specific language, and verify /cookies-policy page exists or remove the reference."
          />

          <Card className="shadow-sm border-border/60 bg-teal/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal" /> What's Done Well
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  "Title tags are excellent — keyword-rich, well-structured, include location",
                  "Meta descriptions are compelling and include key differentiators (Level 4, Worthing, specialist)",
                  "Comprehensive JSON-LD schema: LocalBusiness, Person, Article, BreadcrumbList, WebSite, Review",
                  "OG tags and Twitter cards properly configured with og-image.svg",
                  "Geo meta tags present (GB-WSX, Worthing, West Sussex)",
                  "Content quality is outstanding — matches brand voice perfectly",
                  "Clean URL structure without trailing slashes",
                  "Pricing page exists (was 404 on old site) with clear packages",
                  "FAQ page has actual Q&A content with proper categories",
                  "Internal linking between service pages and blog posts",
                  "No before/after framing — aligns with brand guidelines",
                  "Author byline on blog posts (just wrong author name)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TECHNICAL SEO ==================== */}
        <TabsContent value="technical" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /> Robots Meta — Critical Issue</CardTitle></CardHeader>
            <CardContent>
              <IssueCard
                title="All Pages: noindex, nofollow"
                impact="critical"
                description='Every page returns: <meta name="robots" content="noindex, nofollow" />. This blocks Google from indexing AND following links on every page. The site will have zero organic visibility.'
                fix="In the Next.js metadata config (likely layout.tsx or a shared metadata file), change robots from 'noindex, nofollow' to 'index, follow' for production builds. Consider using environment variable to keep noindex on staging."
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Crawlability & Indexation</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Element</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Robots.txt</TableCell>
                    <TableCell><StatusBadge status="warn" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">Allows all crawling, blocks /api/. References sitemap at eternalfitness.co.uk/sitemap.xml (no hyphen).</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">XML Sitemap</TableCell>
                    <TableCell><StatusBadge status="pass" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">Present with 34 URLs (7 pages + 27 blog posts). Proper lastmod dates, changefreq, and priority values.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Canonical URLs</TableCell>
                    <TableCell><StatusBadge status="warn" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">All canonicals point to eternalfitness.co.uk (no hyphen). Should match the actual live domain.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">Site Architecture</TableCell>
                    <TableCell><StatusBadge status="pass" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">All pages within 1 click of homepage. Clean hierarchy: Home → About / PT / Pricing / FAQs / Blog.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">HTTPS</TableCell>
                    <TableCell><StatusBadge status="pass" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">Vercel provides automatic HTTPS. No mixed content issues.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Site Architecture</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>In Nav</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "/", "pass", "Yes"],
                    ["About", "/about", "pass", "Yes"],
                    ["Personal Training", "/personal-training", "pass", "Yes"],
                    ["Pricing", "/pricing", "pass", "Yes"],
                    ["FAQs", "/faqs", "pass", "Yes"],
                    ["Blog", "/blog", "pass", "Yes"],
                    ["Contact", "/contact", "pass", "Footer"],
                    ["Privacy Policy", "/privacy-policy", "pass", "Footer"],
                    ["Terms", "/terms", "pass", "Footer"],
                  ].map(([page, url, status, nav]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{url}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell className="text-xs">{nav}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Schema & Structured Data</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">The staging site has excellent schema coverage with 7 JSON-LD blocks on the homepage:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schema Type</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["LocalBusiness", "pass", "Includes name, description, address, geo, telephone, openingHours, priceRange, image, sameAs (social links)"],
                    ["Person (Esther Fair)", "pass", "Includes jobTitle, url, telephone, email, worksFor"],
                    ["BreadcrumbList", "pass", "Present but only has Home item — needs full breadcrumb chain on deeper pages"],
                    ["Review", "pass", "Two 5-star reviews from Mary C and Angela M included in LocalBusiness schema"],
                    ["WebSite", "pass", "Includes name, url, description, publisher"],
                    ["Article (blog posts)", "pass", "Includes headline, description, image, datePublished, author (but wrong author)"],
                    ["FAQPage", "fail", "Missing — FAQ page should have FAQPage schema"],
                  ].map(([type, status, notes]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium text-sm">{type}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md">{notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Performance & Core Web Vitals</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Next.js 14 (App Router)</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Vercel Edge Network</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Font Preloading (woff2)</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Image Preloading (hero-gym.jpg)</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">CSS Precedence (Next.js optimised)</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">JavaScript Bundle Count (15+ chunks)</span>
                <StatusBadge status="warn" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ON-PAGE SEO ==================== */}
        <TabsContent value="onpage" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Title Tags</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Title Tag</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Assessment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "Level 4 Personal Trainer for Health Conditions in Worthing", "58", "pass"],
                    ["About", "Esther Fair: Specialist in Cancer Rehab & Complex Health Needs | Eternal Fitness", "82", "warn"],
                    ["Personal Training", "Personal Training in Worthing for Health Conditions and Complex Needs | Eternal Fitness", "87", "warn"],
                    ["Pricing", "Cancer Rehabilitation Training Pricing in Worthing from £45 | Eternal Fitness", "76", "warn"],
                    ["FAQs", "FAQs: Cancer Rehab, Disability, Health Conditions Training | Eternal Fitness", "76", "warn"],
                    ["Blog", "Health Conditions & Cancer Recovery Blog | Eternal Fitness", "56", "pass"],
                    ["Contact", "Contact Eternal Fitness — Book a Free Consultation in Worthing | Eternal Fitness", "80", "warn"],
                  ].map(([page, title, len, status]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs font-mono max-w-xs truncate">{title}</TableCell>
                      <TableCell className="text-xs">{len} chars</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">Several titles exceed 60 characters and may be truncated in SERPs. The keywords are excellent but consider shortening to keep the full title visible.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Meta Descriptions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Meta Description</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Assessment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "Private one-to-one personal training in Worthing with Level 4 trainer Esther Fair. Specialist for health conditions, cancer rehab, disability and more.", "155", "pass"],
                    ["About", "Meet Esther Fair: Cancer Rehabilitation & Exercise Referral Specialist. Level 4 qualified trainer for health conditions, disability, and complex needs.", "152", "pass"],
                    ["Personal Training", "Personal training in Worthing with a Level 4 specialist. Sessions adapted for health conditions, cancer rehab, disability, and complex medical needs.", "155", "pass"],
                    ["Pricing", "Specialist personal training pricing in Worthing. Sessions from £45. No contracts, no surprises. Free consultation with Level 4 trainer.", "141", "pass"],
                    ["FAQs", "Common questions about personal training at Eternal Fitness in Worthing. Health conditions, cancer rehab, disability, pricing, and more.", "139", "pass"],
                    ["Blog", "Articles on training with health conditions, cancer rehabilitation, adaptive fitness and moving well at any ability. Written by Esther Fair.", "143", "pass"],
                    ["Contact", "Get in touch with Esther Fair at Eternal Fitness in Worthing. Call 07517 658 128, email, or use the contact form to book a free consultation.", "152", "pass"],
                  ].map(([page, desc, len, status]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{desc}</TableCell>
                      <TableCell className="text-xs">{len} chars</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">All meta descriptions are well-written, within the 150-160 character range, and include key differentiators. Excellent work.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Open Graph & Twitter Cards</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Homepage Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["og:title", "Level 4 Personal Trainer for Health Conditions in Worthing", "pass"],
                    ["og:description", "Private one-to-one personal training in Worthing...", "pass"],
                    ["og:type", "website", "pass"],
                    ["og:site_name", "Eternal Fitness", "pass"],
                    ["og:locale", "en_GB", "pass"],
                    ["og:image", "https://eternalfitness.co.uk/og-image.svg (1200x630)", "pass"],
                    ["twitter:card", "summary_large_image", "pass"],
                    ["twitter:title", "Level 4 Personal Trainer for Health Conditions in Worthing", "pass"],
                    ["twitter:description", "Private one-to-one personal training in Worthing...", "pass"],
                    ["twitter:image", "https://eternalfitness.co.uk/og-image.svg (1200x630)", "pass"],
                  ].map(([tag, val, status]) => (
                    <TableRow key={tag}>
                      <TableCell className="font-mono text-xs">{tag}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{val}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Heading Structure</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">The staging site uses a clean heading hierarchy. Each page has a single H1 with relevant keywords. H2s are used for section headings with clear topical structure.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>H1</TableHead>
                    <TableHead>H1 Count</TableHead>
                    <TableHead>Assessment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "Rehabilitation and Recovery Training in Worthing for Complex Health Needs", "1", "pass"],
                    ["About", "About Esther Fair — Cancer Rehabilitation Specialist", "1", "pass"],
                    ["Personal Training", "Cancer Rehabilitation and Recovery Training in Worthing", "1", "pass"],
                    ["Pricing", "Straightforward pricing. No contracts. No surprises.", "1", "warn"],
                    ["FAQs", "Frequently Asked Questions", "1", "pass"],
                    ["Blog", "My Blog", "1", "warn"],
                    ["Contact", "Get in Touch", "1", "pass"],
                  ].map(([page, h1, count, status]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{h1}</TableCell>
                      <TableCell className="text-xs">{count}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">Pricing page H1 ("Straightforward pricing...") is creative but lacks keyword value. Consider: "Personal Training Pricing in Worthing — From £45 per Session". Blog page H1 ("My Blog") is too generic — consider "Health & Fitness Blog — Training with Complex Health Conditions".</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Image Optimisation</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Descriptive alt text on images</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Alt text includes keywords and location</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Hero image preloaded (fetchPriority="high")</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Image format (JPG — not WebP)</span>
                <StatusBadge status="warn" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Images use descriptive alt text like "Esther Fair, Level 4 personal trainer at Eternal Fitness Worthing" — excellent. Consider converting to WebP for better compression. Next.js Image component can handle this automatically.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== KEYWORDS PER PAGE ==================== */}
        <TabsContent value="keywords" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Page-Level Keyword Optimisation</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Target Keywords (Identified)</TableHead>
                    <TableHead>In Title</TableHead>
                    <TableHead>In H1</TableHead>
                    <TableHead>In URL</TableHead>
                    <TableHead>In Content</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "level 4 personal trainer, personal training worthing, health conditions", "pass", "pass", "—", "pass", 90],
                    ["About", "esther fair, cancer rehabilitation specialist, level 4 PT worthing", "pass", "pass", "pass", "pass", 85],
                    ["Personal Training", "personal training worthing, cancer rehabilitation, health conditions PT", "pass", "pass", "pass", "pass", 90],
                    ["Pricing", "personal training pricing worthing, PT costs, cancer rehab training price", "pass", "warn", "pass", "pass", 75],
                    ["FAQs", "personal training FAQ, cancer rehab questions, disability training FAQ", "pass", "pass", "pass", "pass", 85],
                    ["Blog", "health conditions blog, cancer recovery blog, adaptive fitness articles", "pass", "warn", "pass", "pass", 70],
                    ["Contact", "contact personal trainer worthing, book PT consultation", "pass", "warn", "pass", "pass", 75],
                  ].map(([page, kw, title, h1, url, content, score]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs max-w-xs text-muted-foreground">{kw}</TableCell>
                      <TableCell><StatusBadge status={title as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell><StatusBadge status={h1 as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell><StatusBadge status={url as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell><StatusBadge status={content as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell><OptBar score={score as number} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Blog Posts — Keyword Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blog Post</TableHead>
                    <TableHead>Target Keywords</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Myth Buster: Resistance training & blood pressure", "resistance training blood pressure, weightlifting blood pressure", "General", "Aug 2022", "fail", 75],
                    ["The importance of staying hydrated", "hydration exercise, how much water to drink", "Training", "Aug 2022", "fail", 65],
                    ["BMI — outdated assessment", "BMI inaccurate, body mass index flawed", "Training", "Aug 2022", "fail", 70],
                    ["Exercise & Illness", "exercise when ill, training with cold", "Training", "Apr 2022", "fail", 70],
                    ["Rate of perceived exertion (RPE)", "RPE scale, rate of perceived exertion exercise", "Training", "Apr 2022", "fail", 75],
                    ["Myth Buster: Is warmup necessary?", "warmup before exercise, is warmup needed", "General", "Apr 2022", "fail", 75],
                    ["Menopause and exercise", "menopause exercise, training during menopause", "Training", "Mar 2022", "fail", 80],
                    ["Myth Buster: Low fat foods healthy?", "low fat foods healthy, low fat diet myths", "General", "Mar 2022", "fail", 75],
                    ["Getting back on track", "restart exercise routine, get back to fitness", "General", "Mar 2022", "fail", 60],
                    ["Myth Buster: Target fat loss?", "spot reduction myth, target fat loss areas", "General", "Feb 2022", "fail", 75],
                    ["Are you sabotaging your weight loss?", "weight loss sabotage, why not losing weight", "General", "Feb 2022", "fail", 65],
                    ["Why lift heavier weights", "lifting heavier weights, strength training benefits", "Training", "Feb 2022", "fail", 75],
                    ["Inflammation and the Body", "inflammation exercise, reduce inflammation naturally", "General", "Jan 2022", "fail", 70],
                    ["Myth Buster: Stretch before workout?", "stretch before workout, pre-workout stretching", "General", "Jan 2022", "fail", 75],
                    ["New Years resolutions", "fitness new year resolutions, exercise goals", "General", "Dec 2021", "fail", 60],
                    ["Importance of sleep for health", "sleep and health, sleep exercise recovery", "General", "Dec 2021", "fail", 70],
                    ["Myth Buster: No pain no gain?", "no pain no gain myth, DOMS exercise", "General", "Dec 2021", "fail", 75],
                    ["Will lifting weights make me bulky?", "will weights make me bulky, women lifting weights", "General", "Nov 2021", "fail", 75],
                    ["Benefits of lifting weights", "benefits of weight training, strength training benefits", "Training", "Nov 2021", "fail", 75],
                    ["Tips to avoid Christmas weight gain", "avoid christmas weight gain, stay fit christmas", "General", "Nov 2021", "fail", 60],
                    ["Myth Buster: Ab exercises flat stomach?", "ab exercises flat stomach, spot reduce belly fat", "General", "Nov 2021", "fail", 75],
                    ["Myth Buster: Running bad for knees?", "running bad for knees, running knee osteoarthritis", "General", "Nov 2021", "fail", 75],
                    ["Protein — what it is & why you need it", "protein benefits, why need protein exercise", "General", "Oct 2021", "fail", 65],
                    ["Fat — what it is & why you need it", "dietary fat benefits, fat in healthy diet", "General", "Oct 2021", "fail", 65],
                    ["Carbohydrate — what it is & why you need it", "carbohydrates benefits, carbs healthy diet", "General", "Oct 2021", "fail", 65],
                    ["Myth Buster: Muscle weigh more than fat?", "muscle weigh more than fat, muscle vs fat density", "General", "Oct 2021", "fail", 75],
                    ["Why is goal setting important?", "goal setting personal training, fitness goals", "General", "Oct 2021", "pass", 70],
                  ].map(([post, kw, cat, date, author, score]) => (
                    <TableRow key={post}>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate">{post}</TableCell>
                      <TableCell className="text-xs max-w-[180px] text-muted-foreground truncate">{kw}</TableCell>
                      <TableCell><Badge variant="outline" className="rounded-full text-xs">{cat}</Badge></TableCell>
                      <TableCell className="text-xs">{date}</TableCell>
                      <TableCell>{author === "pass" ? <StatusBadge status="pass" /> : <StatusBadge status="fail" />}</TableCell>
                      <TableCell><OptBar score={score as number} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">Author column: <span className="text-red-600 font-semibold">fail</span> = Craig Blackman (should be Esther Fair). <span className="text-green-600 font-semibold">pass</span> = Esther Fair (only 1 of 27 posts).</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Missing Keyword Opportunities</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword Group</TableHead>
                    <TableHead>Est. Volume</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["adaptive personal training worthing", "Low", "Very Low", "Create dedicated page or section"],
                    ["personal trainer for long COVID", "Low-Med", "Very Low", "New blog post — high-value niche"],
                    ["exercise referral worthing", "Medium", "Low", "Add to personal-training page content"],
                    ["cancer rehabilitation personal trainer", "Medium", "Low", "Already well-covered — good"],
                    ["menopause personal trainer worthing", "Medium", "Low", "Blog post exists — create service page"],
                    ["private personal training studio worthing", "Low", "Very Low", "Add to homepage and about content"],
                    ["parkinson's exercise therapist worthing", "Low", "Very Low", "New blog post or service section"],
                    ["post-surgery rehabilitation worthing", "Low-Med", "Low", "Add to personal-training page content"],
                  ].map(([kw, vol, comp, action]) => (
                    <TableRow key={kw}>
                      <TableCell className="font-medium text-sm">{kw}</TableCell>
                      <TableCell className="text-xs">{vol}</TableCell>
                      <TableCell><Badge variant="outline" className="rounded-full text-xs">{comp}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CONTENT AUDIT ==================== */}
        <TabsContent value="content" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">E-E-A-T Assessment</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Experience", "pass", "Esther's personal story on About page demonstrates first-hand experience. Client testimonials (Mary C, Angela M) provide social proof."],
                    ["Expertise", "pass", "Level 4 qualification prominently featured. Cancer Rehabilitation and Exercise Referral specialisms clearly stated. Blog posts demonstrate knowledge."],
                    ["Authoritativeness", "warn", "FitPro membership not mentioned. No external citations or industry recognition visible. Blog author is wrong (Craig Blackman)."],
                    ["Trustworthiness", "pass", "HTTPS, privacy policy, terms present. Contact info clearly displayed. No before/after framing. No hype language."],
                  ].map(([factor, status, details]) => (
                    <TableRow key={factor}>
                      <TableCell className="font-semibold text-sm">{factor}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md">{details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 bg-teal/5">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal" /> Content Quality — Excellent</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>The staging site content is a massive improvement over the old WordPress site:</p>
              <ul className="space-y-1.5 ml-4">
                {[
                  "Brand voice is warm, expert, and solution-focused — no fitness hype",
                  "No before/after framing — aligns with brand guidelines",
                  "Level 4 qualification is prominent on every page",
                  "Clinical specialisms (cancer rehab, exercise referral, adaptive training) are clearly communicated",
                  "Inclusive language throughout — no gendered assumptions",
                  "Real client testimonials with names and locations",
                  "Pricing is transparent with clear package options",
                  "FAQ page has actual Q&A content covering health conditions, disability, inclusivity",
                  "About page tells Esther's personal story authentically",
                  "CTA language is warm and non-pressuring ('Book a Free Consultation')",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <IssueCard
            title="Blog Author Attribution — Craig Blackman on 26 of 27 Posts"
            impact="high"
            description="All blog posts show 'Craig Blackman' as the author in the visible byline and Article schema. Only 1 post ('Why is goal setting in Personal Training so important?') correctly shows Esther Fair. This severely damages E-E-A-T signals."
            fix="Update the blog post data source (likely a CMS or content file) to use Esther Fair as the author for all posts. Update the Article schema author field accordingly."
          />

          <IssueCard
            title="Blog Content Stale — No New Posts Since August 2022"
            impact="high"
            description="All 27 blog posts are from October 2021 - August 2022. The content has been migrated from the old WordPress site but nothing new has been added."
            fix="Establish a content calendar. Publish 2-4 posts per month. Prioritise topics that align with Esther's specialisms: cancer rehab exercise, exercise referral, menopause fitness, adaptive training, long COVID recovery."
          />

          <IssueCard
            title="Privacy Policy Is Outdated (2020) and References California"
            impact="medium"
            description='The privacy policy is dated "December 06, 2020" and includes a section on "California residents\' rights" which is irrelevant for a UK-based business. Also references /cookies-policy which may not exist.'
            fix="Update the privacy policy with current date, remove California section, add UK GDPR-specific language, and verify /cookies-policy page exists or remove the reference."
          />

          <IssueCard
            title="Blog Page H1 Is Too Generic"
            impact="low"
            description='The blog page H1 is "My Blog" which has no keyword value. The page title is better ("Health Conditions & Cancer Recovery Blog | Eternal Fitness") but the H1 should match.'
            fix='Change the blog page H1 to something like "Health & Fitness Blog — Training with Complex Health Conditions" to include relevant keywords.'
          />
        </TabsContent>

        {/* ==================== LOCAL SEO ==================== */}
        <TabsContent value="local" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">LocalBusiness Schema</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">The staging site has comprehensive LocalBusiness schema with the following fields:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["@type", "LocalBusiness", "pass"],
                    ["name", "Eternal Fitness", "pass"],
                    ["description", "Private one-to-one personal training in Worthing...", "pass"],
                    ["telephone", "07517658128", "pass"],
                    ["email", "esther.fair@eternal-fitness.co.uk", "pass"],
                    ["url", "https://eternalfitness.co.uk", "warn"],
                    ["address", "Present (Worthing, West Sussex)", "pass"],
                    ["geo", "Present (latitude/longitude)", "pass"],
                    ["openingHours", "Present", "pass"],
                    ["priceRange", "Present", "pass"],
                    ["image", "Present", "pass"],
                    ["sameAs", "Facebook, Instagram, LinkedIn, YouTube", "pass"],
                    ["review", "2 reviews (5-star)", "pass"],
                  ].map(([field, val, status]) => (
                    <TableRow key={field}>
                      <TableCell className="font-mono text-sm">{field}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{val}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">The URL field uses eternalfitness.co.uk (no hyphen) — should match the actual live domain eternal-fitness.co.uk.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Geo Meta Tags</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">geo.region</span>
                <span className="text-xs font-mono">GB-WSX</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">geo.placename</span>
                <span className="text-xs font-mono">Worthing, West Sussex</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">ICBM (geo coordinates)</span>
                <span className="text-xs font-mono">Not found</span>
                <StatusBadge status="warn" />
              </div>
            </CardContent>
          </Card>

          <IssueCard
            title="Google Business Profile — Status Unknown"
            impact="high"
            description="No evidence of Google Business Profile integration on the site. For a local business in Worthing, GBP is the single most important local SEO factor."
            fix="If GBP exists: ensure it's fully optimised with correct NAP, categories (Personal Trainer, Health and Wellness Centre), photos, posts, and reviews. If it doesn't exist: create one immediately. Embed GBP reviews on the site."
          />

          <IssueCard
            title="Canonical URL Domain Mismatch"
            impact="medium"
            description="Canonical URLs and schema URLs use eternalfitness.co.uk (no hyphen) but the live domain is eternal-fitness.co.uk (with hyphen). This could cause canonical confusion."
            fix="Update the canonical URL base in the metadata configuration to use eternal-fitness.co.uk (with hyphen). Verify the actual live domain matches."
          />

          <Card className="shadow-sm border-border/60 bg-teal/5">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-teal" /> Local Citation Opportunities</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {["Google Business Profile (essential)", "Bing Places", "Yell.com", "Thomson Local", "FitPro directory (member)", "Local Worthing business directories", "NHS exercise referral provider listings", "Facebook Business Page"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-teal mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACTION PLAN ==================== */}
        <TabsContent value="action" className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">!</span>
              Phase 1: Critical — Before Launch
            </h3>
            {[
              { title: "Remove noindex, nofollow from all pages", detail: "In the Next.js metadata config (layout.tsx or shared metadata), change robots from 'noindex, nofollow' to 'index, follow' for production builds. Use environment variable to keep noindex on staging.", time: "10 min", priority: "critical" },
              { title: "Fix canonical URL domain (hyphen vs no-hyphen)", detail: "Verify the live domain is eternal-fitness.co.uk (with hyphen). Update all canonical URLs and schema URLs to match.", time: "15 min", priority: "critical" },
              { title: "Fix blog author attribution — Craig → Esther", detail: "Update the blog post data source to use Esther Fair as author for all 27 posts. Update Article schema author field.", time: "1 hour", priority: "high" },
            ].map((item, i) => (
              <Card key={i} className={`shadow-sm border-border/60 ${item.priority === "critical" ? "border-l-4 border-l-red-600" : "border-l-4 border-l-rose"}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${item.priority === "critical" ? "bg-red-600 text-white" : "bg-rose text-white"}`}>{i + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    <Badge variant="outline" className="rounded-full text-xs mt-2">{item.time}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2 mt-6">
            <h3 className="text-lg font-bold">Phase 2: High-Impact (Week 1-2)</h3>
            {[
              { title: "Update Privacy Policy", detail: "Update date, remove California section, add UK GDPR language, verify /cookies-policy exists.", time: "1 hour" },
              { title: "Fix Pricing Page H1", detail: 'Change from "Straightforward pricing. No contracts. No surprises." to "Personal Training Pricing in Worthing — From £45 per Session".', time: "5 min" },
              { title: "Fix Blog Page H1", detail: 'Change from "My Blog" to "Health & Fitness Blog — Training with Complex Health Conditions".', time: "5 min" },
              { title: "Shorten Title Tags Over 60 Chars", detail: "About (82), Personal Training (87), Pricing (76), FAQs (76), Contact (80) — all may be truncated in SERPs.", time: "30 min" },
              { title: "Add FAQPage Schema to /faqs", detail: "The FAQ page has excellent Q&A content but no FAQPage schema. Add structured data for rich results.", time: "30 min" },
              { title: "Expand BreadcrumbList Schema", detail: "Currently only has Home item. Add full breadcrumb chain on deeper pages (About, PT, Pricing, Blog posts).", time: "1 hour" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    <Badge variant="outline" className="rounded-full text-xs mt-2">{item.time}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2 mt-6">
            <h3 className="text-lg font-bold">Phase 3: Quick Wins</h3>
            {[
              "Add ICBM geo coordinates meta tag (5 min)",
              "Convert images to WebP using Next.js Image component (2 hours)",
              "Add og:image:alt to Open Graph tags (10 min)",
              "Verify sitemap.xml URL matches live domain (5 min)",
              "Set up Google Search Console for the live domain (15 min)",
            ].map((item, i) => (
              <Card key={i} className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-dark-navy text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2 mt-6">
            <h3 className="text-lg font-bold">Phase 4: Long-Term Strategy (Ongoing)</h3>
            {[
              { title: "Launch Content Calendar — 2-4 Blog Posts Per Month", detail: "Prioritise: cancer rehab exercise, adaptive training, long COVID, menopause fitness, exercise referral.", time: "Ongoing" },
              { title: "Create Missing Service Pages", detail: "Adaptive Personal Training, Menopause Personal Training, Post-Surgery Rehabilitation.", time: "Month 2-3" },
              { title: "Build Local Citations", detail: "List on Yell, Thomson Local, FitPro directory, NHS exercise referral listings, local Worthing directories.", time: "Month 1-2" },
              { title: "Set Up Google Business Profile", detail: "Create or optimise GBP with correct categories, photos, posts, and review management.", time: "Month 1" },
              { title: "Monitor Core Web Vitals", detail: "Run regular PageSpeed Insights tests. Optimise JS bundle count. Ensure all images use Next.js Image.", time: "Ongoing" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    <Badge variant="outline" className="rounded-full text-xs mt-2">{item.time}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
