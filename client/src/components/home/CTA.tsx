import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-merriweather font-bold mb-6">
          Ready to Understand Your Union Contract?
        </h2>
        <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
          Join thousands of union members who are using Contract Companion to
          understand their rights and benefits.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="#upload-contract">
            <Button
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-4 px-8 rounded-md transition duration-300 text-lg w-full sm:w-auto"
              size="lg"
            >
              Get Started For Free
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-100 text-primary font-semibold py-4 px-8 rounded-md transition duration-300 text-lg w-full sm:w-auto"
              size="lg"
            >
              Schedule a Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
