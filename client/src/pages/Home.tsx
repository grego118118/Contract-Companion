import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ContractUpload from "@/components/home/ContractUpload";
import ChatDemo from "@/components/home/ChatDemo";
import BlogSection from "@/components/home/BlogSection";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <ContractUpload />
      <ChatDemo />
      <BlogSection />
      <Testimonials />
      <CTA />
    </div>
  );
};

export default Home;
