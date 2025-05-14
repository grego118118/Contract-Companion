import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BlogCard from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const BlogSection = () => {
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/blog/featured"],
    retry: false,
  });

  // Fallback blog posts for when API is loading or unavailable
  const fallbackPosts = [
    {
      id: "1",
      title: "Nurses Union Secures Landmark Staff-to-Patient Ratio Agreement",
      excerpt:
        "After months of negotiations, Local 456 Nurses Union has secured a groundbreaking agreement establishing mandatory staff-to-patient ratios, ensuring better patient care and working conditions.",
      imageUrl:
        "https://images.unsplash.com/photo-1573496546038-82f9c39f6365?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
      categories: ["Healthcare", "Contract Win"],
      publishedAt: "2023-03-15T00:00:00Z",
    },
    {
      id: "2",
      title: "Arbitration Victory Reinstates Unjustly Terminated Workers",
      excerpt:
        "Five workers wrongfully terminated for union organizing activities have been reinstated with full back pay following a successful arbitration case that set a precedent for the industry.",
      imageUrl:
        "https://images.unsplash.com/photo-1529420705456-5c7e04dd043d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
      categories: ["Manufacturing", "Arbitration Win"],
      publishedAt: "2023-02-28T00:00:00Z",
    },
    {
      id: "3",
      title: "Teachers Union Wins Retroactive Pay After Contract Dispute",
      excerpt:
        "Local 789 Teachers Union successfully resolved a grievance resulting in retroactive pay increases for over 500 teachers after the district failed to implement agreed-upon raises.",
      imageUrl:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
      categories: ["Education", "Grievance Win"],
      publishedAt: "2023-01-12T00:00:00Z",
    },
  ];

  const displayPosts = blogPosts || fallbackPosts;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-merriweather font-bold">
            Union Victory Stories
          </h2>
          <Link href="/blog">
            <Button
              variant="link"
              className="text-primary hover:underline font-semibold flex items-center"
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
