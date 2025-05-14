import { Star, StarHalf } from "lucide-react";

const testimonials = [
  {
    name: "Michael Johnson",
    organization: "IBEW Local 134",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48",
    content:
      "Contract Companion helped me understand my overtime rights when management was trying to make me work extra shifts. I showed them the exact language from our contract, and they backed down immediately.",
    rating: 5,
  },
  {
    name: "Sarah Martinez",
    organization: "SEIU Healthcare",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48",
    content:
      "As a shop steward, this tool has been invaluable. I can quickly look up specific contract provisions during grievance meetings instead of paging through a printed contract. It's saved me countless hours.",
    rating: 4.5,
  },
  {
    name: "David Thompson",
    organization: "UAW Local 862",
    image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48",
    content:
      "Our contract is over 200 pages long and it was always difficult to find specific information. Contract Companion lets me ask questions in plain English and points me to the exact section I need.",
    rating: 5,
  },
];

const Testimonials = () => {
  // Helper function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-secondary fill-secondary" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-secondary fill-secondary" />);
    }

    return stars;
  };

  return (
    <section className="py-16 bg-gray-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-merriweather font-bold text-center mb-12">
          What Union Members Are Saying
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="font-merriweather font-bold">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {testimonial.organization}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 italic">{testimonial.content}</p>
              <div className="mt-4 flex text-secondary">
                {renderStars(testimonial.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
