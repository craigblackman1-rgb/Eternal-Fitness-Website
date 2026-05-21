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
  AlertCircle,
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
} from "lucide-react";

function PriorityBadge({ level }: { level: "high" | "medium" | "low" }) {
  const map = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`rounded-full text-xs font-semibold ${map[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: { icon: <CheckCircle className="w-3.5 h-3.5" />, text: "Pass", cls: "bg-green-100 text-green-700 border-green-200" },
    warn: { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    fail: { icon: <XCircle className="w-3.5 h-3.5" />, text: "Issue", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const { icon, text, cls } = map[status];
  return (
    <Badge variant="outline" className={`rounded-full text-xs font-semibold gap-1 ${cls}`}>
      {icon} {text}
    </Badge>
  );
}

function OptBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-teal" : score >= 40 ? "bg-amber" : "bg-rose";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-off-white overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold w-8">{score}%</span>
    </div>
  );
}

function IssueCard({ title, impact, description, fix }: { title: string; impact: "high" | "medium" | "low"; description: string; fix: string }) {
  const border = { high: "border-l-rose", medium: "border-l-amber", low: "border-l-teal" };
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

export default function SEOAuditPage() {
  const [tab, setTab] = useState("executive");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SEO Audit</h1>
          <p className="text-muted-foreground mt-1">eternal-fitness.co.uk &middot; Audited {auditDate} &middot; 14 pages + 28 blog posts</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1 rounded-full"><Globe className="w-3 h-3" /> WordPress + Elementor</Badge>
          <Badge variant="outline" className="gap-1 rounded-full"><Search className="w-3 h-3" /> Rank Math</Badge>
          <Badge variant="outline" className="gap-1 rounded-full"><BarChart3 className="w-3 h-3" /> Cloudflare</Badge>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Overall Health", score: "C+", color: "text-amber", icon: <BarChart3 className="w-5 h-5" /> },
          { label: "Technical SEO", score: "B", color: "text-teal", icon: <Globe className="w-5 h-5" /> },
          { label: "On-Page SEO", score: "C", color: "text-amber", icon: <FileText className="w-5 h-5" /> },
          { label: "Content Freshness", score: "D", color: "text-rose", icon: <Clock className="w-5 h-5" /> },
          { label: "Schema & Structured Data", score: "C+", color: "text-amber", icon: <Target className="w-5 h-5" /> },
          { label: "Local SEO", score: "C", color: "text-amber", icon: <MapPin className="w-5 h-5" /> },
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
              <p>Eternal Fitness has a solid technical foundation with Rank Math SEO, Cloudflare CDN, XML sitemaps, and proper HTTPS. The site is crawlable and indexable. However, there are significant opportunities for improvement in on-page optimisation, content freshness, keyword targeting, and local SEO.</p>
              <p>The site has not published new blog content since <strong className="text-foreground">August 2022</strong> (nearly 4 years), which is the single biggest concern for organic growth. Several pages use outdated copy that doesn't reflect the current brand positioning (Level 4 PT, clinical specialisms, Worthing location).</p>
            </CardContent>
          </Card>

          <h3 className="text-lg font-bold mt-6">Top 5 Priority Issues</h3>

          <IssueCard
            title="Blog Content Stale — No New Posts Since August 2022"
            impact="high"
            description="28 blog posts, all from 2021-2022. Zero new content in ~4 years. Google favours sites that publish regularly. This is the biggest barrier to organic growth and topical authority."
            fix="Publish 2-4 new blog posts per month targeting clinical fitness topics (cancer rehab exercise, exercise referral, menopause training, adaptive fitness). Update existing posts with current information."
          />
          <IssueCard
            title="Homepage Meta Description Doesn't Reflect Key Differentiators"
            impact="high"
            description='Current: "I work with Women, Cancer patients and individuals with medical conditions." Missing: Level 4 qualification, Worthing location, private studio, personal training keyword prominence.'
            fix='Rewrite to: "Level 4 Personal Trainer in Worthing specialising in cancer rehabilitation, exercise referral & adaptive fitness. Private 1-to-1 sessions in our dedicated studio."'
          />
          <IssueCard
            title="No Dedicated Pricing Page (404)"
            impact="high"
            description="/pricing/ returns 404. Pricing is embedded within /personal-training/ page as anchor sections. This misses a high-intent search opportunity for 'personal training prices Worthing' and similar queries."
            fix="Create a dedicated /pricing/ page with full pricing details, package comparisons, and clear CTAs. Link from navigation."
          />
          <IssueCard
            title='Brand Voice Inconsistency — "Before/After" Framing on About Page'
            impact="medium"
            description="The About page includes 'Before' and 'After' labels with photos — directly contradicting the brand guidelines which explicitly ban before/after transformation framing for clinical populations."
            fix="Remove before/after labels and reframe as Esther's personal journey story. Replace with Esther's professional narrative about becoming a Level 4 PT."
          />
          <IssueCard
            title="Missing LocalBusiness Schema & Google Business Profile Signals"
            impact="medium"
            description="Schema uses generic HealthAndBeautyBusiness type. Missing LocalBusiness schema with address, geo coordinates, service area, and review markup."
            fix="Update schema to LocalBusiness with full address, geo, opening hours, service area (Worthing, Brighton, Shoreham-by-Sea, West Sussex). Set up/optimise Google Business Profile."
          />

          <Card className="shadow-sm border-border/60 bg-teal/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal" /> Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  "Rewrite homepage meta description (5 min)",
                  'Fix title tags on 6 pages to include primary keywords near the start (30 min)',
                  "Add alt text to 15+ images missing descriptive alt attributes (1 hour)",
                  "Fix FAQ page — currently has no actual FAQ content, just service links (30 min)",
                  "Create /pricing/ page (2 hours)",
                  "Update About page to remove before/after framing (30 min)",
                  "Add LocalBusiness schema with full address (30 min)",
                  "Set up Google Business Profile if not already done (1 hour)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-teal mt-0.5 shrink-0" />
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
            <CardHeader><CardTitle className="text-lg">Crawlability & Indexation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <IssueCard
                title="Robots.txt — Well Configured"
                impact="low"
                description="Properly allows crawling, blocks /wp-admin/, references sitemap. Cloudflare AI crawler blocking is correctly configured (blocks GPTBot, CCBot, ClaudeBot, etc.)."
                fix="No action needed. Note: Sitemap reference points to /sitemap_index.xml but actual sitemap is at /sitemap.xml — both work via redirect but should be consistent."
              />
              <IssueCard
                title="XML Sitemap — Present & Well-Structured"
                impact="low"
                description="Sitemap includes page-sitemap.xml, post-sitemap.xml, category-sitemap.xml, and elementor-hf-sitemap.xml. All properly formatted with lastmod dates."
                fix="Concern: Elementor header/footer pages are included in the sitemap (elementor-hf-sitemap.xml). These should be excluded as they're template pages, not content."
              />
              <IssueCard
                title="HTTP vs WWW Canonical Inconsistency"
                impact="medium"
                description="The site uses www.eternal-fitness.co.uk as canonical. The robots.txt and some internal references use non-www. Ensure all traffic redirects to www consistently."
                fix="Verify Cloudflare page rules or WordPress settings enforce www redirect. Check that eternal-fitness.co.uk (non-www) 301 redirects to www.eternal-fitness.co.uk."
              />
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
                    <TableHead>Clicks from Home</TableHead>
                    <TableHead>In Nav</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "/", "200", "0", "Yes"],
                    ["About Me", "/about/", "200", "1", "Yes"],
                    ["Personal Training", "/personal-training/", "200", "1", "Yes"],
                    ["Medical Conditions", "/exercising-with-a-medical-condition/", "200", "1", "Yes"],
                    ["Cancer Rehabilitation", "/cancer-rehabilitation-and-exercise/", "200", "1", "Yes"],
                    ["What's on Offer", "/whats-on-offer/", "200", "1", "Yes"],
                    ["Testimonials", "/testimonials/", "200", "1", "Yes"],
                    ["FAQs", "/faqs/", "200", "1", "Yes"],
                    ["Contact", "/contact/", "200", "1", "Yes"],
                    ["Blog", "/blog/", "200", "1", "Yes"],
                    ["Pricing", "/pricing/", "404", "—", "No"],
                    ["Privacy Policy", "/privacy-policy/", "200", "2", "Footer"],
                    ["Terms & Conditions", "/terms-conditions/", "200", "2", "Footer"],
                    ["Cookies Policy", "/cookies-policy/", "200", "2", "Footer"],
                  ].map(([page, url, status, clicks, nav]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium text-sm">{page}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{url}</TableCell>
                      <TableCell>
                        {status === "200" ? <StatusBadge status="pass" /> : <StatusBadge status="fail" />}
                      </TableCell>
                      <TableCell className="text-xs">{clicks}</TableCell>
                      <TableCell className="text-xs">{nav}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Schema & Structured Data</CardTitle></CardHeader>
            <CardContent>
              <IssueCard
                title="Schema Present But Could Be Improved"
                impact="medium"
                description="Rank Math injects JSON-LD schema including Organization, WebSite, WebPage, Article, and Person types. Issues: Organization type is HealthAndBeautyBusiness (should be LocalBusiness), missing address/geo/service area, missing FAQPage schema, author is set to 'Craig Blackman' instead of 'Esther Fair', no review/rating schema, no BreadcrumbList schema."
                fix="Update Rank Math settings to use LocalBusiness schema type. Add full business address, phone, geo coordinates. Set author to Esther Fair. Add FAQPage schema to /faqs/. Add Service schema for PT services."
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Security & Performance</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">HTTPS</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Cloudflare CDN</span>
                <StatusBadge status="pass" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Image Formats (mixed .webp/.jpg/.png)</span>
                <StatusBadge status="warn" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm">Lazy Loading on Images</span>
                <StatusBadge status="warn" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Astra Theme (lightweight)</span>
                <StatusBadge status="pass" />
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
                    <TableHead>Current Title Tag</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Assessment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "Eternal Fitness | Personal Training Worthing", "47", "pass"],
                    ["About", "About Me - Eternal Fitness", "26", "fail"],
                    ["Personal Training", "Personal Training | Womens | Worthing | Eternal Fitness", "56", "warn"],
                    ["Medical Conditions", "Exercising with a medical condition - Eternal Fitness", "55", "warn"],
                    ["Cancer Rehab", "Cancer Rehabilitation and Exercise | Eternal Fitness", "53", "warn"],
                    ["What's on Offer", "What's on offer - Eternal Fitness", "33", "fail"],
                    ["Testimonials", "Testimonials - Eternal Fitness", "30", "warn"],
                    ["FAQs", "FAQ's - Eternal Fitness", "23", "fail"],
                    ["Contact", "Contact - Eternal Fitness", "25", "warn"],
                    ["Blog", "Blog - Eternal Fitness", "22", "fail"],
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
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Heading Structure Issues</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>H1 Content</TableHead>
                    <TableHead>H1 Count</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["About", "About Me / My journey", "Multiple", "fail"],
                    ["Personal Training", "Personal Training / Designed for Women's Needs", "Multiple", "fail"],
                    ["Medical Conditions", "Coaching for health / Exercising with a medical condition", "Multiple", "fail"],
                    ["Cancer Rehab", "Cancer Rehabilitation", "1", "pass"],
                    ["Testimonials", "Testimonials", "1", "pass"],
                    ["FAQs", "Frequently Asked Questions", "1", "pass"],
                    ["Contact", "Contact me", "Multiple", "fail"],
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
            </CardContent>
          </Card>

          <IssueCard
            title="FAQ Page Has No FAQ Content"
            impact="high"
            description="The /faqs/ page title says 'Frequently Asked Questions' but the page body contains links to service pages, not actual questions and answers. The page structure suggests it may be using Elementor accordions but promotional service links dilute the FAQ purpose."
            fix="Ensure FAQ page contains proper Q&A content with FAQPage schema. Remove promotional service links from the FAQ page body. Target long-tail question keywords."
          />

          <IssueCard
            title="Personal Training Page Targets Women Only — Excludes Key Populations"
            impact="high"
            description="The /personal-training/ page is titled 'Personal Training Designed for Women's Needs' and uses women-only language. This excludes Esther's other key populations: exercise referral clients, cancer rehabilitation, adaptive training, and male clients with complex needs."
            fix="Option A: Reframe /personal-training/ as the main service page covering all populations. Option B: Keep women-focused page but create additional pages for 'Adaptive Personal Training' to capture those search queries."
          />
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
                    <TableHead>Target Keywords</TableHead>
                    <TableHead>In Title</TableHead>
                    <TableHead>In H1</TableHead>
                    <TableHead>In URL</TableHead>
                    <TableHead>In Content</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Homepage", "personal training worthing, personal trainer worthing, eternal fitness", "pass", "warn", "—", "pass", 70],
                    ["About Me", "level 4 personal trainer, esther fair, worthing PT", "fail", "fail", "—", "pass", 40],
                    ["Personal Training", "personal training for women, womens PT worthing", "pass", "pass", "pass", "pass", 75],
                    ["Medical Conditions", "exercise referral, GP exercise referral worthing", "warn", "pass", "pass", "pass", 65],
                    ["Cancer Rehabilitation", "cancer rehabilitation exercise, cancer exercise specialist", "pass", "pass", "pass", "pass", 80],
                    ["What's on Offer", "personal training services", "fail", "fail", "fail", "warn", 25],
                    ["Testimonials", "personal trainer reviews worthing", "fail", "fail", "—", "warn", 35],
                    ["FAQs", "personal training FAQ, PT questions worthing", "fail", "warn", "—", "fail", 20],
                    ["Contact", "book personal training worthing", "fail", "fail", "—", "warn", 30],
                    ["Blog", "exercise tips, fitness myths, menopause exercise", "fail", "fail", "—", "pass", 45],
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
                    ["personal trainer Worthing", "High", "Medium", "Optimise homepage + dedicated page"],
                    ["level 4 personal trainer", "Medium", "Low", "Create dedicated page"],
                    ["exercise referral Worthing", "Medium", "Low", "Optimise existing page or create new"],
                    ["adaptive personal training", "Low-Med", "Very Low", "Create new dedicated page"],
                    ["personal training prices Worthing", "Medium", "Low", "Create /pricing/ page (currently 404)"],
                    ["private personal training studio Worthing", "Low", "Very Low", "Add to homepage and About"],
                    ["menopause personal trainer", "Medium", "Low", "Create dedicated service page"],
                    ["personal trainer for long COVID", "Low-Med", "Very Low", "Create dedicated page — high-value niche"],
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
                    ["Experience", "pass", "Esther's personal story on About page demonstrates first-hand experience. Client testimonials provide social proof."],
                    ["Expertise", "warn", "Qualifications listed on About page. Level 4 differentiator is not prominent enough on homepage or service pages."],
                    ["Authoritativeness", "warn", "FitPro membership badge displayed. No external citations or industry recognition visible. Blog posts lack author bylines."],
                    ["Trustworthiness", "pass", "HTTPS, privacy policy, terms, cookies policy present. Contact info clearly displayed. Author attribution shows wrong name."],
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

          <IssueCard
            title="Critical: No New Content Since August 2022"
            impact="high"
            description="All 28 blog posts are from October 2021 - August 2022. Nearly 4 years without a single new blog post. For a local service business, this signals to Google that the site may be abandoned or inactive."
            fix="Establish a content calendar. Publish 2-4 posts per month. Prioritise topics that align with Esther's specialisms: cancer rehab exercise, exercise referral, menopause fitness, adaptive training, long COVID recovery."
          />

          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">Content Gaps — Missing Topics</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Missing Topic</TableHead>
                    <TableHead>Why It Matters</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Adaptive training / disability fitness", "Core service with zero dedicated content", "high"],
                    ["Long COVID and exercise", "High search volume, low competition", "high"],
                    ["Level 4 PT — what it means", "Primary differentiator, no dedicated page", "high"],
                    ["Private studio tour / facility info", "Builds trust, differentiates from gym PTs", "medium"],
                    ["Exercise for Parkinson's", "Specific condition Esther works with", "medium"],
                    ["Post-surgery rehabilitation", "Core service, high-intent searches", "medium"],
                    ["What to expect at your first session", "High-intent, conversion-focused", "medium"],
                    ["Online vs in-person training", "Esther offers both — no comparison", "low"],
                  ].map(([topic, why, priority]) => (
                    <TableRow key={topic}>
                      <TableCell className="font-medium text-sm">{topic}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{why}</TableCell>
                      <TableCell><PriorityBadge level={priority as "high" | "medium" | "low"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <IssueCard
            title='Author Attribution Shows "Craig Blackman"'
            impact="medium"
            description="Schema markup and Twitter card metadata show 'Craig Blackman' as the author. All content should be attributed to Esther Fair for E-E-A-T purposes."
            fix="In WordPress, change the default post author to Esther Fair. Update Rank Math settings to use Esther as the default author."
          />
        </TabsContent>

        {/* ==================== LOCAL SEO ==================== */}
        <TabsContent value="local" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader><CardTitle className="text-lg">NAP Consistency</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Element</TableHead>
                    <TableHead>Value Found</TableHead>
                    <TableHead>Consistent?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Business Name", "Eternal Fitness / Eternal Fitness Personal Training", "warn"],
                    ["Phone", "07517 658 128", "pass"],
                    ["Email", "esther.fair@eternal-fitness.co.uk", "pass"],
                    ["Address", "Worthing, West Sussex (no full street address)", "warn"],
                    ["Service Area", "Not explicitly stated", "fail"],
                  ].map(([el, val, status]) => (
                    <TableRow key={el}>
                      <TableCell className="font-medium text-sm">{el}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{val}</TableCell>
                      <TableCell><StatusBadge status={status as "pass" | "warn" | "fail"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <IssueCard
            title="Google Business Profile — Status Unknown"
            impact="high"
            description="No evidence of Google Business Profile integration on the site. For a local business in Worthing, GBP is the single most important local SEO factor."
            fix="If GBP exists: ensure it's fully optimised with correct NAP, categories (Personal Trainer, Health and Wellness Centre), photos, posts, and reviews. If it doesn't exist: create one immediately."
          />

          <IssueCard
            title="Missing LocalBusiness Schema"
            impact="high"
            description="Current schema uses HealthAndBeautyBusiness type without address, geo coordinates, or service area. This misses critical local SEO signals."
            fix="Update to LocalBusiness schema with: full address (or service area), geo coordinates for Worthing, service area (Worthing, Brighton, Shoreham-by-Sea, West Sussex), price range, opening hours, SameAs links."
          />

          <IssueCard
            title="Location Keywords Under-Optimised"
            impact="medium"
            description="'Worthing' appears in the homepage title and meta description but is missing from several key pages: /about/, /exercising-with-a-medical-condition/, /cancer-rehabilitation-and-exercise/, /faqs/, /contact/."
            fix="Add 'Worthing' and 'West Sussex' naturally to title tags, meta descriptions, and body content on all service pages."
          />

          <Card className="shadow-sm border-border/60 bg-teal/5">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-teal" /> Local Citation Opportunities</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {["Google Business Profile (essential)", "Bing Places", "Yell.com", "Thomson Local", "FitPro directory (member)", "Local Worthing business directories", "NHS exercise referral provider listings", "Facebook Business Page (exists)"].map((item) => (
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
            <h3 className="text-lg font-bold">Phase 1: Critical Fixes (Week 1-2)</h3>
            {[
              { title: "Fix Author Attribution — Change from Craig Blackman to Esther Fair", detail: "WordPress admin → Users → Set Esther as default author. Update all existing posts. Fix Rank Math schema settings.", time: "30 min" },
              { title: "Rewrite Homepage Meta Description", detail: 'New: "Level 4 Personal Trainer in Worthing specialising in cancer rehabilitation, exercise referral & adaptive fitness. Private 1-to-1 sessions."', time: "10 min" },
              { title: "Remove Before/After Framing from About Page", detail: "Remove 'Before' and 'After' labels. Reframe as Esther's professional journey. Align with brand guidelines.", time: "30 min" },
              { title: "Create /pricing/ Page", detail: "Dedicated pricing page with Block of 12 (£480), Block of 24 (£840), package comparisons, and clear CTAs.", time: "2 hours" },
              { title: "Fix Title Tags on 6 Pages", detail: "About, FAQs, Contact, Blog, What's on Offer, Testimonials — all need keyword-rich titles with location.", time: "30 min" },
              { title: "Update LocalBusiness Schema", detail: "Add address, geo coordinates, service area, price range, and SameAs links via Rank Math.", time: "30 min" },
            ].map((item, i) => (
              <Card key={i} className="shadow-sm border-border/60">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
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
            <h3 className="text-lg font-bold">Phase 2: High-Impact Improvements (Week 3-4)</h3>
            {[
              { title: "Audit & Fix FAQ Page Content", detail: "Ensure FAQ page contains actual Q&A content with FAQPage schema. Remove promotional service links.", time: "2 hours" },
              { title: "Add Alt Text to All Images", detail: "Review every image across the site. Add descriptive, keyword-relevant alt text.", time: "2 hours" },
              { title: "Set Up / Optimise Google Business Profile", detail: "Create or optimise GBP with correct categories, photos, posts, and review management.", time: "2 hours" },
              { title: "Fix Personal Training Page Voice", detail: "Rewrite confrontational 'not for you if' sections. Align with Esther's warm, expert voice.", time: "1 hour" },
              { title: "Add Location Keywords to All Service Pages", detail: "Add 'Worthing' and 'West Sussex' naturally to title tags, meta descriptions, and body content.", time: "1 hour" },
              { title: "Add Internal Links from Blog Posts to Service Pages", detail: "Edit top 10 blog posts to include contextual links to relevant service pages.", time: "2 hours" },
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
              'Fix "Womens" to "Women\'s" in title tag (2 min)',
              'Fix "FAQ\'s" to "FAQs" in navigation & title (5 min)',
              'Fix "conditons" typo on Medical Conditions page (2 min)',
              "Verify WWW redirect consistency (15 min)",
              "Exclude Elementor template pages from sitemap (10 min)",
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
              { title: "Create Missing Service Pages", detail: "Adaptive Personal Training, Level 4 PT Explained, Menopause Personal Training, Post-Surgery Rehabilitation.", time: "Month 2-3" },
              { title: "Build Local Citations", detail: "List on Yell, Thomson Local, FitPro directory, NHS exercise referral listings, local Worthing directories.", time: "Month 1-2" },
              { title: "Implement Breadcrumb Navigation", detail: "Add BreadcrumbList schema and visual breadcrumbs for better UX and SERP appearance.", time: "Month 2" },
              { title: "Monitor Core Web Vitals & PageSpeed", detail: "Run regular PageSpeed Insights tests. Optimise Elementor bloat. Ensure all images are WebP.", time: "Ongoing" },
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
