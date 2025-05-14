import { Upload, Bot, MessageSquare } from "lucide-react";

const features = [
  {
    icon: <Upload className="text-xl" />,
    title: "Upload Your Contract",
    description:
      "Securely upload your union contract in PDF format. Your document remains private and is only used to provide you with accurate information.",
    bgColor: "bg-blue-100",
    textColor: "text-primary",
  },
  {
    icon: <Bot className="text-xl" />,
    title: "AI Analysis",
    description:
      "Our AI engine powered by Anthropic's technology reads and interprets your contract, understanding its specific terms and conditions.",
    bgColor: "bg-red-100",
    textColor: "text-secondary",
  },
  {
    icon: <MessageSquare className="text-xl" />,
    title: "Ask Questions",
    description:
      "Get instant answers about your rights, benefits, and procedures. The AI assistant references exactly where information comes from in your contract.",
    bgColor: "bg-green-100",
    textColor: "text-accent",
  },
];

const Features = () => {
  return (
    <section className="py-16 bg-gray-light" id="learn-more">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-merriweather font-bold text-center mb-12">
          How Contract Companion Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full ${feature.bgColor} ${feature.textColor} mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-merriweather font-bold mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
