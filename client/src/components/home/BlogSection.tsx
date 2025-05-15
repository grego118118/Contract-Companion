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
      title: "Understanding Your Union Contract: Key Rights to Know",
      excerpt: "A comprehensive overview of the essential rights and protections typically found in union contracts, and how to identify them in your own agreement.",
      imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      categories: ["Rights & Benefits"],
      publishedAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "The Grievance Process Explained: Standing Up for Your Rights",
      excerpt: "A step-by-step guide to understanding and navigating the grievance process when you believe your contract rights have been violated.",
      imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      categories: ["Rights & Benefits"],
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "The History of Labor Unions: Struggles That Secured Your Rights",
      excerpt: "Exploring the rich history of the labor movement and how past struggles have shaped the workplace protections we have today.",
      imageUrl: "https://images.unsplash.com/photo-1588611911587-7bc8ffd4d05d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      categories: ["Union History", "Organizing"],
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const displayPosts = blogPosts || fallbackPosts;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-merriweather font-bold">
            Educational Resources
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
