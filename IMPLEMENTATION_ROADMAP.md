# Implementation Roadmap: Spin-Off Tasks for New Sessions

**Created:** April 19, 2026  
**Purpose:** Break down SEO audit + content strategy into discrete tasks that can be assigned to separate sessions

---

## SESSION 1: CRITICAL SEO FIXES
**Priority:** 🚨 BLOCKING — Do this first  
**Timeline:** Immediate (1-2 hours)  
**Owner:** Backend/Frontend Dev

### Deliverables
- [ ] Remove `noindex` from `app/layout.tsx`
- [ ] Create `/public/robots.txt`
- [ ] Brief: Submit sitemap to Google Search Console (manual task)

**Task Description for New Session:**
```
You are working on Eternal Fitness (personal trainer site in Next.js 14).

CRITICAL: The site is currently noindexed (invisible to search engines). 

TASK 1: Remove noindex directive
- File: app/layout.tsx, lines 30-32
- Change "robots: { index: false, follow: false }" to "{ index: true, follow: true }"
- Deploy immediately

TASK 2: Create robots.txt
- Create file: /public/robots.txt
- Content:
  User-agent: *
  Allow: /
  Sitemap: https://eternalfitness.co.uk/sitemap.xml

TASK 3: Brief for marketing team
- Once deployed, marketing should submit sitemap to Google Search Console
- Monitor indexation progress in GSC Coverage report

Verify with: site:eternalfitness.co.uk should show results within 48 hours of deployment
```

---

## SESSION 2: BLOG CONTENT REPOSITIONING
**Priority:** ⚠️ HIGH — Prevents off-brand content from ranking  
**Timeline:** 3-5 hours  
**Owner:** Content/Marketing

### Deliverables
- [ ] Delete 2 blog posts (weight-loss focused, no relevance)
- [ ] Reframe 3 blog posts (weight-loss → health conditions angle)
- [ ] Update all blog post author bylines

**Blog Posts to Handle:**

| Post | Action | New Title | New Angle |
|------|--------|-----------|-----------|
| "Are you sabotaging your weight loss?" | ❌ DELETE | N/A | Contradicts specialist positioning |
| "Target fat loss to specific body parts?" | ❌ DELETE | N/A | Weight-loss only, no relevance |
| "Getting back on track when you fell off wagon" | 🔄 REFRAME | "Managing Setbacks in Your Recovery Journey" | Focus on health setbacks, not diet cheating |
| "Myth: Are low-fat foods healthy?" | 🔄 REFRAME | "Nutrition for Energy & Recovery (Not Weight Loss)" | Health/healing angle, not diet |
| "BMI outdated assessment" | 🔄 REFRAME | "Why BMI Doesn't Matter When You Have Health Conditions" | Health conditions > generic fitness |

**Task Description for New Session:**
```
You are updating blog posts for Eternal Fitness (specialist personal trainer for health conditions).

PROBLEM: 5 blog posts focus on weight loss. This contradicts the specialist positioning (health conditions, disabilities, cancer recovery - NOT weight loss).

TASK 1: Delete 2 Posts
In Supabase blog_posts table, delete:
1. "Are you sabotaging your weight loss?" (slug: are-you-sabotaging-your-weight-loss)
2. "Is it possible to target fat loss to specific body parts?" (slug: is-it-possible-to-target-fat-loss-to-specific-body-parts)

TASK 2: Reframe 3 Posts (Keep the posts, change the angle)

Post A: "Getting back on track when you've fallen off the wagon"
- Current angle: Weight-loss yo-yo dieting
- New title: "Managing Setbacks in Your Recovery Journey"
- New angle: For clients with health conditions/disabilities who experience setbacks in training
- Update first paragraph to clarify this is about health/capability recovery, not diet

Post B: "Myth: Are low-fat foods healthy?"
- Current angle: Diet/weight-loss focused
- New title: "Nutrition for Energy & Recovery (Not Weight Loss)"
- New angle: How to eat for healing/energy, not for weight loss
- Update first paragraph to reposition around health/recovery

Post C: "BMI an outdated & inaccurate assessment"
- Current angle: Weight-loss focused
- New title: "Why BMI Doesn't Matter When You Have Health Conditions"
- New angle: BMI is especially irrelevant for people with health conditions/disabilities
- Highlight: Muscle gain, bone density, functional capability matter more than BMI

TASK 3: Update Author Bylines
In Supabase blog_posts table, update author_name:
- Current: "Craig Blackman"
- New: "Esther Fair, Level 4 Personal Trainer, Cancer Rehabilitation Specialist"
- Apply to ALL 14 blog posts

Verification: 
- Deleted posts should return 404
- Reframed posts should have new titles + angles visible
- Blog list should show "Esther Fair" as author on all posts
```

---

## SESSION 3: UPDATE TITLE TAGS & META DESCRIPTIONS
**Priority:** ⚠️ HIGH — Improves SERP appearance + SEO alignment  
**Timeline:** 2-3 hours  
**Owner:** Frontend/SEO

### Deliverables
- [ ] Update 5 title tags (all major pages)
- [ ] Refine 3 meta descriptions
- [ ] Verify changes in browser

**Task Description for New Session:**
```
You are optimizing page titles and descriptions for Eternal Fitness (personal trainer site).

Context: Site specializes in health conditions, disabilities, cancer recovery - NOT generic fitness/weight loss.

TASK 1: Update Title Tags (in page metadata)

File: app/page.tsx (Homepage)
- Current: "Eternal Fitness | Level 4 Personal Trainer in Worthing"
- New: "Level 4 Personal Trainer for Health Conditions in Worthing"

File: app/about/page.tsx
- Current: "About Esther Fair — Level 4 Personal Trainer in Worthing"
- New: "Esther Fair: Specialist in Cancer Rehab & Complex Health Needs"

File: app/pricing/page.tsx
- Current: "Personal Training Pricing in Worthing — No Contracts, No Surprises"
- New: "Cancer Rehabilitation Training Pricing in Worthing from £45"

File: app/blog/page.tsx
- Current: "Fitness & Health Blog — Eternal Fitness Worthing"
- New: "Health Conditions & Cancer Recovery Blog"

File: app/faqs/page.tsx
- Current: "FAQs — Personal Training in Worthing..."
- New: "FAQs: Cancer Rehab, Disability, Health Conditions Training"

TASK 2: Refine Meta Descriptions

File: app/about/page.tsx
- Current: "Meet Esther Fair... Specialist support for complex needs."
- New: "Meet Esther Fair: Cancer Rehabilitation & Exercise Referral Specialist. Level 4 qualified trainer for health conditions, disabilities, and complex needs."

File: app/pricing/page.tsx
- Current: "Transparent personal training pricing... Single sessions from £45..."
- New: "Specialist personal training pricing in Worthing. Sessions from £45. No contracts, no surprises. Free consultation with all packages."

File: app/contact/page.tsx
- Current: "Get in touch... free 30-minute consultation."
- New: "Book your free specialist consultation with Esther Fair. 30-minute session to discuss your health condition and training approach."

TASK 3: Verify in Browser
- Visit each page
- Check page title in browser tab
- Right-click > Inspect to verify metadata is correct
```

---

## SESSION 4: UPDATE PAGE COPY FOR SPECIALIST POSITIONING
**Priority:** ⚠️ HIGH — Ensures messaging reinforces specialist ICP  
**Timeline:** 4-6 hours  
**Owner:** Copywriting/Marketing

### Deliverables
- [ ] Update About page copy (emphasize specialist credentials + complex health needs)
- [ ] Update Personal Training page copy (health conditions focus, remove generic language)
- [ ] Update Homepage sections (hero + key sections realigned to specialist messaging)

**Task Description for New Session:**
```
You are updating copy across 3 key pages for Eternal Fitness (specialist trainer for health conditions).

CONTEXT: The site was drafted with generic fitness language. Now we need to emphasize:
- Specialist focus: Health conditions, disabilities, cancer recovery
- Target audience: People who DON'T fit generic gyms/trainers
- Differentiation: Level 4 qualified + cancer rehab + exercise referral specialist
- Remove: Generic "transformation" language, weight-loss mentions

TASK 1: Update About Page
File: app/about/AboutPageClient.tsx

Changes needed in the story section:
- Remove generic "I wasn't confident at fitness" narrative (too common)
- Replace with: "I became a Level 4 trainer specifically to work with clients other trainers turn away"
- Add specific examples: "cancer recovery," "post-surgery clients," "people with mobility disabilities," "exercise referral"
- Emphasize: NOT about weight loss or aesthetics, but about capability and independence

Changes in the Qualifications section:
- Lead with: "Most trainers hold Level 3. I hold Level 4 BECAUSE I specialize in complex cases."
- Reorder quals: Cancer Rehab first (most valuable differentiator), then Exercise Referral, then Level 4

Changes in the Experience section:
- Already strong, but add: "I've trained clients with cancer, spinal injuries, visual impairment, post-natal concerns, and much more"
- Clarify: "If you think your situation is 'too complex,' you're wrong. That's exactly what I'm qualified for."

TASK 2: Update Personal Training Page
File: app/personal-training/PersonalTrainingClient.tsx

Hero section:
- Current angle: Generic "personalized training"
- New angle: Lead with "For people whose health conditions exclude them from generic fitness"
- Add: "Level 4 qualified. Specialist in cancer rehabilitation, exercise referral, disability adaptation."

Main content sections:
- Add specific client examples: "People recovering from cancer treatment," "Those with mobility disabilities," "Post-surgery clients," "People with chronic health conditions"
- Remove: Generic "results" language
- Replace with: "Capability, independence, confidence, safe progression"

CTAs:
- Current: "Book a consultation"
- New: "Book a consultation to discuss your health condition and training needs"

TASK 3: Update Homepage Sections
File: app/HomePageClient.tsx and component files:
- HeroSection: Lead with "Specialist personal training for health conditions"
- WhySection: Emphasize "who I specialize with" (health conditions, disabilities, cancer recovery)
- SpecialiseSection: Update titles/content to health conditions focus
- WhoSection: Change from generic fitness personas to health condition personas
- All CTAs: Say "Discuss your health condition" not just "Book a consultation"

Verification:
- Read each section aloud - does it sound like specialist coaching for health conditions, or generic fitness?
- Look for words: "transformation," "weight," "loss," "body change," "aesthetic" - these should be GONE
- Look for words: "health condition," "specialist," "Level 4," "cancer," "disability," "recovery" - these should be PRESENT
```

---

## SESSION 5: ADD SCHEMA MARKUP
**Priority:** ⚠️ MEDIUM — Enables rich snippets  
**Timeline:** 2-3 hours  
**Owner:** Frontend/Dev (SEO knowledge required)

### Deliverables
- [ ] Add FAQPage schema to `/faqs` page
- [ ] Add Article schema to blog post template
- [ ] Verify in Google Rich Results Test

**Task Description for New Session:**
```
You are adding structured data (schema markup) to two page types.

Why: Google uses schema to show rich snippets in search results (e.g., FAQ snippets). This increases click-through rate.

TASK 1: Add FAQ Schema to FAQs Page
File: app/faqs/page.tsx

Add this schema in the page component (before the FAQSection render):

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Can you train with cancer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Esther is Level 4 qualified with cancer rehabilitation certification. She specializes in training clients through and after cancer treatment, with safe progression protocols and medical awareness."
      }
    },
    {
      "@type": "Question",
      "name": "What if I have a disability or mobility limitation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Adaptations are built into every session. Esther has extensive experience with mobility limitations, visual impairment, and other disabilities. Training is tailored to your specific situation."
      }
    },
    // ... repeat for each FAQ item
  ]
};

Then add to metadata (like the Personal Training page already does):
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

TASK 2: Add Article Schema to Blog Posts
File: app/blog/[slug]/page.tsx

For each blog post, add Article schema:

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": post.title,
  "description": post.excerpt,
  "image": post.image_url,
  "datePublished": post.published_at,
  "dateModified": post.published_at,
  "author": {
    "@type": "Person",
    "name": "Esther Fair",
    "url": "https://eternalfitness.co.uk/about",
    "jobTitle": "Level 4 Personal Trainer"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Eternal Fitness",
    "logo": {
      "@type": "ImageObject",
      "url": "https://eternalfitness.co.uk/logo.png"
    }
  }
};

Then render in the page.

TASK 3: Verify with Google Rich Results Test
URL: https://search.google.com/test/rich-results

- Paste homepage URL → should show Organization schema
- Paste FAQ page URL → should show FAQPage schema
- Paste blog post URL → should show NewsArticle schema

Look for: Green checkmarks, no errors, schema properly recognized.
```

---

## SESSION 6: INTERNAL LINKING & TOPIC CLUSTERING
**Priority:** ⚠️ MEDIUM — Improves topical authority  
**Timeline:** 3-4 hours  
**Owner:** SEO/Content Strategy

### Deliverables
- [ ] Create topic cluster map (visual or spreadsheet)
- [ ] Add internal links to blog posts (related articles + /personal-training)
- [ ] Verify no broken links

**Task Description for New Session:**
```
You are creating a topic clustering strategy and implementing internal linking.

Why: Google uses internal links to understand content relationships and topic authority. Linking related blog posts together tells Google they're part of the same topic cluster.

TASK 1: Create Topic Cluster Map
Create a spreadsheet or visual document showing:

Cluster 1: Cancer Rehabilitation
├─ Blog: "Cancer & Exercise: What's Safe During Treatment & Recovery"
├─ Blog: "Exercise & Illness" (existing post)
└─ Link to: /personal-training page

Cluster 2: Mobility & Disability
├─ Blog: "Strength Training with Mobility Limitations"
├─ Blog: "Fall Prevention & Balance"
└─ Link to: /personal-training page + /about page

Cluster 3: Post-Surgery Recovery
├─ Blog: "Safe Post-Surgery Strength Progression"
├─ Blog: "Managing Setbacks in Recovery" (reframed post)
└─ Link to: /personal-training page

Cluster 4: Health Conditions (Menopause, Arthritis, Diabetes, etc.)
├─ Blog: "Menopause & Exercise" (existing)
├─ Blog: "Training with Arthritis"
├─ Blog: "Diabetes & Exercise"
└─ Link to: /personal-training page

TASK 2: Add Internal Links to Existing Blog Posts
For each blog post, add 2-3 related links:

Example in "Cancer & Exercise" post:
"For more on safe progression after cancer treatment, see our guide on [cancer rehabilitation training](/personal-training)."

"You can also read about [exercise during illness](/blog/exercise-illness) for broader context on activity during health challenges."

Link format: Use descriptive anchor text with health condition keywords
Avoid: "Click here," "Read more" (bad for SEO)

TASK 3: Update /personal-training page with blog links
On the Personal Training page, add a section:

"Related Articles:
- [Cancer & Exercise: What's Safe During Treatment & Recovery](/blog/cancer-exercise)
- [Strength Training with Mobility Limitations](/blog/strength-mobility-disabilities)
- [Managing Setbacks in Your Recovery Journey](/blog/managing-recovery-setbacks)"

TASK 4: Verify Links
- Click every link and verify destination page loads
- Check that anchor text makes sense in context
- No broken internal links (404s)
```

---

## SESSION 7: BLOG CONTENT CALENDAR & NEW POSTS
**Priority:** 🟢 LONG-TERM — Ongoing  
**Timeline:** 5+ hours (planning + writing)  
**Owner:** Content Strategy + Writing

### Deliverables
- [ ] 27-post content calendar (12-month map)
- [ ] 5 high-priority blog posts written
- [ ] Posts optimized for keywords + internally linked

**Task Description for New Session:**
```
You are creating a strategic content calendar and writing the first batch of blog posts.

CONTEXT: Eternal Fitness specializes in health conditions, disabilities, cancer recovery. Need to build organic visibility through targeted blog content.

TASK 1: Create 27-Post Content Calendar
Spreadsheet with columns:
- Month
- Post #
- Title
- Target Keyword(s)
- Content Type (searchable/shareable/both)
- Buyer Stage (awareness/consideration/decision/implementation)
- Estimated Search Volume
- Difficulty (low/medium/high)
- Assigned Writer
- Publishing Date

Content Clusters (see SEO_AUDIT_REPORT.md):
1. Cancer Rehabilitation (6 posts)
2. Mobility & Disability Adaptation (6 posts)
3. Post-Surgery Recovery (6 posts)
4. Menopause & Aging Health (4 posts)
5. Specialist Positioning/Authority (4 posts)
6. Nutrition for Recovery (3 posts)

Example posts to include:
- "Cancer & Exercise: What's Safe During Treatment & Recovery"
- "Level 4 Personal Trainer: Why It Matters for Complex Health Needs"
- "Strength Training with Mobility Limitations: Adapted Approaches"
- "What a Specialist Trainer Can Do That Your Gym Can't"
- "5 Questions to Ask Before Hiring a Personal Trainer"
- "Post-Surgery Strength: Safe Progression Timelines"
- "Building Strength to Do What Matters: Real Goals Beyond Aesthetics"
- ... and 19 more

TASK 2: Write 5 High-Priority Blog Posts (Month 1)
Posts to write:
1. "Cancer & Exercise: What's Safe During Treatment & Recovery"
2. "Level 4 Personal Trainer: Why It Matters for Complex Health Needs"
3. "Strength Training with Mobility Limitations: Adapted Approaches"
4. "What a Specialist Trainer Can Do That Your Gym Can't"
5. "5 Questions to Ask Before Hiring a Personal Trainer"

Each post should:
- Be 1500-2000 words
- Target 1 primary keyword (plus related keywords naturally)
- Answer real questions from audience
- Include 2-3 internal links to related content + /personal-training
- Have author byline: "Esther Fair, Level 4 Personal Trainer, Cancer Rehabilitation Specialist"
- Address a specific pain point or question

Writing guide:
- Lead with empathy: "If you've been turned away by trainers because of your health condition..."
- Be specific: Don't say "health conditions," say "cancer recovery," "mobility disabilities," "post-op rehabilitation"
- Show expertise: Reference Level 4 qualification, specific protocols
- Provide value: Actual guidance, not just promotion
- End with CTA: "Book a consultation to discuss your specific situation"

TASK 3: Optimize for SEO
Before publishing:
- Verify title includes target keyword
- Verify meta description is compelling + includes keyword
- Verify first 100 words answer the main question
- Verify internal links (2-3 per post)
- Run through Hemingway Editor (clarity check)
- Verify author byline shows Esther Fair's credentials
```

---

## SESSION 8: MONITORING & ONGOING OPTIMIZATION
**Priority:** 🟢 LONG-TERM — Monthly  
**Timeline:** 1-2 hours per month  
**Owner:** Marketing/Analytics

### Deliverables
- [ ] Google Search Console account set up + sitemap submitted
- [ ] Monthly tracking spreadsheet created
- [ ] Monthly review process documented

**Task Description for New Session:**
```
You are setting up ongoing SEO monitoring for Eternal Fitness.

TASK 1: Set Up Google Search Console
1. Go to https://search.google.com/search-console
2. Sign in with Gmail account
3. Add property: https://eternalfitness.co.uk
4. Verify ownership (via DNS or HTML file)
5. Submit sitemap: https://eternalfitness.co.uk/sitemap.xml
6. Monitor Coverage report (track indexation progress)

TASK 2: Create Monthly Tracking Spreadsheet
Columns:
- Date
- Pages Indexed (from GSC)
- Keywords Ranking Top 10 (manual check or tool)
- Organic Traffic (from Analytics)
- Top Ranking Posts
- New Keywords Appearing
- Notes/Actions

TASK 3: Set Monthly Review Process
Every 1st Monday of month:
- Check GSC Coverage report (all pages indexed?)
- Check GSC Search Analytics (which keywords getting clicks?)
- Check Analytics (organic traffic trend)
- Check top blog posts (which content performs best?)
- Plan next month's content based on what's working

TASK 4: Document Success Metrics
Track:
- Days until full indexation after noindex removed (target: <30 days)
- # of pages ranking in top 10 (target: 5+ within 3 months)
- Monthly organic traffic (target: 100+ sessions within 3 months)
- Blog post engagement (time on page, scroll depth)

Report findings monthly.
```

---

## HOW TO SPIN OFF TASKS

**Template for Creating New Session:**

```
Title: [Session Name] (e.g., "Remove Noindex & Create robots.txt")

Description:
I have an Eternal Fitness personal training site that needs SEO work. 
I've completed a comprehensive SEO audit and created an implementation plan.

This session is for: [SESSION X: NAME]

Key context:
- Site is noindexed (invisible to Google) - need to fix
- Blog has off-brand weight-loss posts - need to remove/reframe
- Specialist positioning: health conditions, cancer recovery, disabilities
- 14 blog posts total (36% are weight-loss focused and need repositioning)

Your task:
[Copy the relevant task description from above]

Files to edit:
- [List specific files]

Success criteria:
- [What done looks like]

Reference documents:
- SEO_AUDIT_REPORT.md (full findings)
- plan.md (implementation roadmap)
- product-marketing-context.md (specialist ICP)
```

---

## CURRENT STATUS

✅ **Completed:**
- SEO audit (detailed report)
- Content strategy (4-pillar framework)
- Product marketing context (updated for specialist positioning)
- Implementation roadmap (this document)
- Session 2: Blog repositioning (reframed 3 posts, deleted 2, author updates done)
- Session 3: Title tags updated + meta descriptions trimmed to ≤160 chars across all pages
- Session 5: Schema markup (FAQPage, LocalBusiness, Person, Service schemas already in place)
- Meta descriptions trimmed to ≤160 chars (homepage, /personal-training, /faqs, /blog)
- Google Fonts @import replaced with next/font/google (self-hosted, no render-blocking)
- 301 redirects added for 3 renamed slugs from Session 2
- OG image placeholder created (/public/og-image.svg)
- fetchpriority="high" added to hero image (LCP improvement)
- Image dimensions added to CTA, Approach, Who sections (CLS reduction)
- Duplicate footer links to /personal-training consolidated to one strong link
- Outbound links added from Pricing and About pages
- 6 components migrated from `<img>` to `next/image` (Hero, Why, Who, CTA, Approach, Specialise)
- ef-project.json created with all 34 cards tracked by status

🟡 **Ready to Start (no DB needed):**
- EF-016: Security headers via vercel.json
- EF-015: Convert HomePageClient.tsx to server component
- EF-025: Audit unused Radix UI packages
- EF-012: Write "What Is a Level 4 Personal Trainer?" post
- EF-013: Write "Exercise Referral in Worthing" post
- EF-024: Write "Personal Trainer for Disabilities" post

🔴 **Blocked — needs Supabase service role key:**
- Session 7 migration (5 new blog posts ready to go)
- Fix WordPress-style broken links in blog content (/slug/ → /blog/slug/)
- Add internal content links to blog posts (topic clustering)

🟢 **Production-only (skipped on staging):**
- Session 1: Remove noindex (EF-001)
- Google Search Console setup (EF-004)
- Google Business Profile setup (EF-009)

🔄 **Next (after DB items):**
- Session 6: Internal linking & topic clustering
- Session 8: Monitoring & ongoing optimization
- Month 2 blog posts (5 posts)
- Dedicated pillar pages (/cancer-rehabilitation, /exercise-referral, /adaptive-training)

---

**Total Time to Complete All Phases:** ~40-50 hours spread over 3 months
**Critical Path (Sessions 1-4):** ~10-15 hours, must be done first week
**ROI:** Potential for 50-100+ organic visits/month from specialist keywords within 3 months

---

Last updated: April 19, 2026
