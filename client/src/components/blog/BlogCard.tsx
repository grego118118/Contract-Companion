import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  categories: string[];
  publishedAt: string;
}

interface BlogCardProps {
  post: BlogPost;
  compact?: boolean;
}

const BlogCard = ({ post, compact = false }: BlogCardProps) => {
  // Format date
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Category badge color mapping
  const getCategoryColor = (category: string) => {
    const categoryMap: Record<string, string> = {
      Healthcare: "bg-blue-100 text-blue-800",
      "Contract Win": "bg-green-100 text-accent",
      Manufacturing: "bg-yellow-100 text-yellow-800",
      "Arbitration Win": "bg-red-100 text-secondary",
      Education: "bg-purple-100 text-purple-800",
      "Grievance Win": "bg-green-100 text-accent",
    };

    return categoryMap[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <Link href={`/blog/${post.id}`}>
      <Card className="blog-card overflow-hidden shadow-md transition duration-300 h-full">
        <img
          src={post.imageUrl}
          alt={post.title}
          className={`w-full ${compact ? "h-32" : "h-48"} object-cover`}
        />
        <CardContent className={`p-6 ${compact ? "pb-3" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {post.categories.map((category, index) => (
              <Badge
                key={index}
                variant="outline"
                className={getCategoryColor(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          <h3
            className={`font-merriweather font-bold ${
              compact ? "text-lg" : "text-xl"
            } mb-2 line-clamp-2`}
          >
            {post.title}
          </h3>
          <p
            className={`text-gray-600 mb-4 ${
              compact ? "text-sm line-clamp-2" : "line-clamp-3"
            }`}
          >
            {post.excerpt}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{formattedDate}</span>
            {!compact && (
              <span className="text-primary font-semibold hover:underline">
                Read More
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogCard;
