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
  "Healthcare",
  "Manufacturing",
  "Education",
  "Contract Win",
  "Arbitration Win",
  "Grievance Win",
];

const FALLBACK_BLOG_POSTS = [
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
  {
    id: "4",
    title: "Hospital Workers Secure Improved Safety Protocols Through Collective Bargaining",
    excerpt:
      "Union members at City General Hospital have won enhanced safety measures including improved PPE standards and hazard pay for frontline workers through their latest round of collective bargaining.",
    imageUrl:
      "https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
    categories: ["Healthcare", "Contract Win"],
    publishedAt: "2023-04-05T00:00:00Z",
  },
  {
    id: "5",
    title: "Auto Workers Grievance Results in Back Pay for Misclassified Employees",
    excerpt:
      "A successful grievance filed by the United Auto Workers has resulted in over $2 million in back pay for 150 workers who were incorrectly classified at a lower pay grade for over two years.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
    categories: ["Manufacturing", "Grievance Win"],
    publishedAt: "2022-11-18T00:00:00Z",
  },
  {
    id: "6",
    title: "University Staff Union Successfully Negotiates Remote Work Provisions",
    excerpt:
      "After a year of negotiations, the university staff union has secured flexible remote work options in their new contract, allowing eligible employees to work remotely up to three days per week.",
    imageUrl:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=340",
    categories: ["Education", "Contract Win"],
    publishedAt: "2022-09-24T00:00:00Z",
  },
];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/blog"],
  });

  const posts = blogPosts || FALLBACK_BLOG_POSTS;

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
          Union Victory Stories
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Learn about recent union victories, successful grievances, and
          arbitration wins that have improved working conditions and rights for
          members.
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
