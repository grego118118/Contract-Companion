import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import BlogDetail from "@/components/blog/BlogDetail";
import BlogCard from "@/components/blog/BlogCard";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";

// Fallback blog post if API fails
const FALLBACK_BLOG_POST = {
  id: "1",
  title: "Nurses Union Secures Landmark Staff-to-Patient Ratio Agreement",
  content: `
    <p>After months of intense negotiations, Local 456 Nurses Union has secured a groundbreaking agreement establishing mandatory staff-to-patient ratios at Central Medical Center, ensuring better patient care and working conditions for hundreds of healthcare workers.</p>
    
    <h2>A Hard-Fought Victory</h2>
    <p>The negotiation process lasted nearly six months, with union representatives pushing back against hospital management's claims that fixed ratios would be too costly to implement. Armed with research demonstrating how proper staffing levels improve patient outcomes and reduce errors, the bargaining committee stood firm.</p>
    
    <p>"This wasn't just about better working conditions for us, though that's important," said Sarah Chen, a registered nurse and member of the bargaining committee. "This was about patient safety. When nurses are assigned too many patients, care inevitably suffers, and patients are put at risk."</p>
    
    <h2>Key Provisions of the Agreement</h2>
    <ul>
      <li>Maximum 1:4 nurse-to-patient ratio in medical-surgical units</li>
      <li>1:2 ratio in intensive care and critical care units</li>
      <li>1:1 ratio for trauma patients and unstable patients</li>
      <li>Financial penalties for the hospital if ratios are not maintained</li>
      <li>Creation of a joint labor-management committee to monitor implementation</li>
    </ul>
    
    <p>Hospital administrators initially resisted these provisions but ultimately agreed when presented with evidence that proper staffing reduces costly complications, readmissions, and length of stay—potentially saving the hospital money in the long run.</p>
    
    <h2>Setting a Precedent</h2>
    <p>Union leaders believe this agreement could serve as a model for other healthcare facilities across the region. "What we've shown is that when we stand together and focus on research-backed proposals that benefit both workers and patients, we can achieve meaningful change," said Union President Marcus Washington.</p>
    
    <p>The contract also includes a 4% wage increase over three years and enhanced protections against mandatory overtime, addressing two other significant concerns voiced by union members.</p>
    
    <h2>Implementation Timeline</h2>
    <p>The new ratios will be phased in over a six-month period, with full implementation required by January 1st. The joint committee will meet monthly to address any challenges that arise during the transition period.</p>
    
    <p>"This is what union solidarity looks like," Chen added. "We stood strong together, and now our patients will receive better care, and nurses won't face the moral distress that comes from being stretched too thin."</p>
  `,
  imageUrl: "https://images.unsplash.com/photo-1573496546038-82f9c39f6365?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=600",
  categories: ["Healthcare", "Contract Win"],
  publishedAt: "2023-03-15T00:00:00Z",
  author: {
    name: "Jennifer Wilson",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48",
  },
};

// Fallback related posts
const FALLBACK_RELATED_POSTS = [
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

const BlogPost = ({ params }: { params: { id: string } }) => {
  const postId = params.id;
  const [, setLocation] = useLocation();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: [`/api/blog/${postId}`],
  });

  const { data: relatedPosts, isLoading: relatedLoading } = useQuery({
    queryKey: [`/api/blog/${postId}/related`],
  });

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPost = post || FALLBACK_BLOG_POST;
  const currentRelatedPosts = relatedPosts || FALLBACK_RELATED_POSTS;

  return (
    <div className="container mx-auto px-4 py-12">
      <SubscriptionBanner />
      <BlogDetail post={currentPost} />

      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-2xl font-merriweather font-bold mb-8">
          Related Articles
        </h2>
        
        {relatedLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentRelatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
