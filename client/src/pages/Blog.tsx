import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BlogCard from "@/components/blog/BlogCard";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const CATEGORIES = [
  "All",
  "Rights & Benefits",
  "Organizing",
  "Negotiations",
  "Legal Updates",
  "Union History",
];

const FALLBACK_BLOG_POSTS = [
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
    title: "Preparing for Contract Negotiations: What Members Should Know",
    excerpt: "How members can effectively participate in the contract negotiation process and make their voices heard in shaping their working conditions.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    categories: ["Negotiations"],
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Recent Legal Decisions Affecting Union Rights",
    excerpt: "An analysis of important court decisions and legislative changes that impact union members' rights and how they might affect your workplace.",
    imageUrl: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    categories: ["Legal Updates"],
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    title: "The History of Labor Unions: Struggles That Secured Your Rights",
    excerpt: "Exploring the rich history of the labor movement and how past struggles have shaped the workplace protections we have today.",
    imageUrl: "https://images.unsplash.com/photo-1588611911587-7bc8ffd4d05d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    categories: ["Union History", "Organizing"],
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    title: "Building Solidarity: Effective Organizing Strategies for Today's Workplace",
    excerpt: "Modern approaches to building union power and solidarity in diverse workplaces, with case studies of successful organizing campaigns.",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    categories: ["Organizing"],
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/blog"],
  });

  // Use fallback posts if API returns empty array or null
  const posts = (blogPosts && blogPosts.length > 0) ? blogPosts : FALLBACK_BLOG_POSTS;

  // Filter posts based on search term and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchTerm === "" ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      post.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-merriweather font-bold text-center mb-4">
          Union Education Resources
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Learn about your rights, contract interpretation, negotiation strategies, and
          labor history to help you better understand and advocate for your workplace rights.
        </p>
        
        <SubscriptionBanner />

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-merriweather font-bold mb-2">
              No articles found
            </h2>
            <p className="text-gray-600">
              Try adjusting your search or category filter to find articles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
