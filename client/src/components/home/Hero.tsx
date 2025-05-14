import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-primary to-indigo-900 text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-merriweather font-bold text-3xl md:text-4xl lg:text-5xl mb-6">
            Understand Your Union Contract with AI Assistance
          </h1>
          <p className="font-source text-lg md:text-xl opacity-90 mb-8">
            Upload your contract, ask questions, and get instant answers powered
            by AI. Stay informed about your rights and benefits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="#upload-contract">
              <Button
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 px-8 rounded-md transition duration-300 text-center w-full sm:w-auto"
                size="lg"
              >
                Upload Your Contract
              </Button>
            </Link>
            <Link href="#learn-more">
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-100 text-primary font-semibold py-3 px-8 rounded-md transition duration-300 text-center w-full sm:w-auto"
                size="lg"
              >
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
