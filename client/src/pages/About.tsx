import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-merriweather font-bold text-center mb-6">
          About Contract Companion
        </h1>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Empowering union members through AI-powered contract understanding
          and educational resources.
        </p>

        <div className="mb-12">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=400"
            alt="Team of professionals working together"
            className="w-full h-64 object-cover rounded-xl mb-8"
          />

          <h2 className="text-2xl font-merriweather font-bold mb-4">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6">
            Contract Companion was created with a simple but powerful mission:
            to make union contracts accessible and understandable for every
            member. We believe that when workers fully understand their rights
            and benefits, they are better equipped to advocate for themselves
            and their colleagues.
          </p>
          <p className="text-gray-600 mb-6">
            By combining cutting-edge AI technology with a deep respect for the
            labor movement, we've built a tool that demystifies complex contract
            language and puts the power of knowledge in the hands of workers.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-merriweather font-bold mb-4">
            How We Help Union Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-merriweather font-bold text-lg mb-3">
                  Contract Analysis
                </h3>
                <p className="text-gray-600">
                  Our AI technology reads and interprets your union contract,
                  making it easy to find and understand specific provisions
                  that matter to you.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-merriweather font-bold text-lg mb-3">
                  Interactive Q&A
                </h3>
                <p className="text-gray-600">
                  Ask questions about your contract in plain English and get
                  clear, accurate answers with direct references to the
                  relevant sections.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-merriweather font-bold text-lg mb-3">
                  Educational Resources
                </h3>
                <p className="text-gray-600">
                  Learn from our collection of success stories, grievance wins,
                  and arbitration victories to better understand how contracts
                  work in practice.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-merriweather font-bold mb-4">
            Our Team
          </h2>
          <p className="text-gray-600 mb-6">
            Contract Companion was founded by a team of labor advocates,
            technologists, and former union representatives who understand
            firsthand the challenges of navigating complex union contracts.
          </p>
          <p className="text-gray-600 mb-6">
            We're committed to building technology that serves workers and
            strengthens the labor movement. Our team brings together expertise
            in artificial intelligence, labor law, and user experience design
            to create a tool that's both powerful and easy to use.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-merriweather font-bold mb-4">
            Privacy and Security
          </h2>
          <p className="text-gray-600 mb-6">
            We take the privacy and security of your information seriously.
            Your contract documents are encrypted and stored securely, and we
            never share your data with third parties. Only you have access to
            your contracts and conversation history.
          </p>
        </div>

        <div className="bg-primary/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-merriweather font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of union members who are using Contract Companion
            to better understand their rights and benefits.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/#upload-contract">
              <Button
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-md transition duration-300 w-full sm:w-auto"
                size="lg"
              >
                Upload Your Contract
              </Button>
            </Link>
            <Link href="/blog">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 font-semibold py-3 px-8 rounded-md transition duration-300 w-full sm:w-auto"
                size="lg"
              >
                Explore Success Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
