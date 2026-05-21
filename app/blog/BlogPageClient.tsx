"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ConsultationDialog from "@/components/ConsultationDialog";
import { useConsultationDialog } from "@/hooks/useConsultationDialog";

const categories = ["All", "Training", "Nutrition", "Recovery", "General"];

const categoryImages: Record<string, string> = {
  Training: "/images/strength-tasks.jpg",
  Nutrition: "/images/mind-body.jpg",
  Recovery: "/images/mobility-movement.jpg",
  General: "/images/hero-gym.jpg",
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_name: string;
  author_avatar: string | null;
  category: string;
  published_at: string;
  is_featured: boolean;
}

export default function BlogPageClient({ posts }: { posts: BlogPost[] }) {
  const { open, setOpen, openDialog } = useConsultationDialog();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = posts.filter((p) => p.is_featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <ConsultationDialog open={open} onOpenChange={setOpen} />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <img src="/images/blog-hero.jpg" alt="Blog" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay/80" />
        <Navbar onBookConsultation={openDialog} />
        <div className="relative z-10 text-center px-6 pt-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-4">My Blog</h1>
          <p className="text-primary-foreground/70 max-w-xl mx-auto text-base md:text-lg mb-8">
            Dive into my blog for insights, tips, and advice to support your health and fitness journey.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={openDialog} className="inline-flex items-center gap-2 bg-rose text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Book an Initial Consultation
            </button>
            <Link href="/about" className="inline-flex items-center gap-2 border border-primary-foreground/30 text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary-foreground/10 transition-colors">
              Visit the Studio
            </Link>
          </div>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-rose/10 text-rose text-xs font-semibold px-4 py-1.5 rounded-full mb-4">My Blog</span>
            <h2 className="text-3xl md:text-4xl text-foreground mb-4">Insights and Inspiration from My Blog</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Dive into my blog for insights, tips, and advice to elevate your health and fitness journey.</p>
          </div>

          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search for blogs" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-full border border-muted bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose" />
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-rose text-white" : "bg-white text-muted-foreground hover:bg-white/80"}`}>
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{posts.length === 0 ? "No blog posts yet. Check back soon!" : "No posts match your search."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 md:py-24 px-6 md:px-12 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-rose/10 text-rose text-xs font-semibold px-4 py-1.5 rounded-full mb-4">Featured Blogs</span>
              <h2 className="text-3xl md:text-4xl text-foreground mb-4">Dive into My Top Posts</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base">Explore my curated selection of top posts, offering insights and valuable tips.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="row-span-2"><FeaturedCard post={featured[0]} large /></div>
              <div className="flex flex-col gap-6">
                {featured.slice(1, 4).map((post) => (
                  <FeaturedCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <FAQSection />
      <CTASection onBookConsultation={openDialog} />
      <Footer />
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden mb-4 aspect-[4/3] bg-white shadow-sm">
        <img src={post.image_url || categoryImages[post.category] || "/images/hero-gym.jpg"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-rose transition-colors">{post.title}</h3>
      {post.excerpt && <p className="text-muted-foreground text-base mb-4 line-clamp-2">{post.excerpt}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center text-rose text-xs font-bold">{post.author_name.charAt(0)}</div>
          <div>
            <p className="text-xs font-semibold text-foreground">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose">Read <ArrowUpRight className="w-3 h-3" /></span>
      </div>
    </Link>
  );
}

function FeaturedCard({ post, large }: { post: BlogPost; large?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group block rounded-2xl overflow-hidden relative shadow-md ${large ? "h-full min-h-[400px]" : "h-48"}`}>
      <img src={post.image_url || categoryImages[post.category] || "/images/hero-gym.jpg"} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex gap-2 mb-2">
          <span className="bg-rose text-white text-xs font-semibold px-2.5 py-1 rounded-full">{post.category}</span>
        </div>
        <h3 className={`font-bold text-primary-foreground ${large ? "text-xl" : "text-base"}`}>{post.title}</h3>
        {large && post.excerpt && <p className="text-primary-foreground/70 text-base mt-2 line-clamp-2">{post.excerpt}</p>}
        {large && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-rose/30 flex items-center justify-center text-white text-xs font-bold">{post.author_name.charAt(0)}</div>
            <span className="text-xs text-primary-foreground/80">{post.author_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
