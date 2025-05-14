import { ChevronLeft, Calendar, User, Tag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogDetailProps {
  post: {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    categories: string[];
    publishedAt: string;
    author: {
      name: string;
      imageUrl: string;
    };
  };
}

const BlogDetail = ({ post }: BlogDetailProps) => {
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
    <article className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/blog">
          <Button variant="ghost" className="flex items-center text-primary">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to All Articles
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-[400px] object-cover rounded-xl"
        />
      </div>

      <div className="mb-8">
        <h1 className="font-merriweather font-bold text-3xl md:text-4xl mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap gap-6 text-gray-600 mb-6">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            <div className="flex gap-2">
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
          </div>
        </div>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
};

export default BlogDetail;
