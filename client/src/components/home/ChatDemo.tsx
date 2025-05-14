import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Hello! I'm your Contract Assistant. I've analyzed your union contract for Local 123. What would you like to know about your contract?",
  },
  {
    role: "user",
    content: "How many sick days am I entitled to per year?",
  },
  {
    role: "assistant",
    content:
      "According to Article 12, Section 3 of your contract (page 18), full-time employees are entitled to 10 paid sick days per calendar year, accrued at a rate of 0.83 days per month.\n\nPart-time employees who work more than 20 hours per week receive sick days on a pro-rated basis.\n\nReference: Article 12, Section 3 (Page 18)",
  },
  {
    role: "user",
    content: "Can I carry over unused sick days to the next year?",
  },
  {
    role: "assistant",
    content:
      "Yes, you can carry over unused sick days. According to Article 12, Section 3.2, employees may carry over up to 5 unused sick days to the following calendar year, for a maximum total of 15 sick days in any given year.\n\nReference: Article 12, Section 3.2 (Page 18)",
  },
];

const ChatDemo = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages([...messages, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        role: "assistant",
        content:
          "I'm sorry, this is just a demo. In the actual application, I would provide an answer to your question based on your contract. To get real answers, please sign up and upload your contract.",
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  return (
    <section className="py-16 bg-gray-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-merriweather font-bold text-center mb-6">
            Get Answers About Your Contract
          </h2>
          <p className="text-center text-gray-600 mb-10">
            See how easy it is to ask questions and get clear, accurate answers
            about your union contract.
          </p>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="mr-2" />
                <h3 className="font-merriweather font-semibold">
                  Contract Assistant
                </h3>
              </div>
              <div>
                <span className="text-xs bg-green-100 text-accent px-2 py-1 rounded-full">
                  Contract: Local 123 CBA 2023
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-4 h-96 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${
                    message.role === "user"
                      ? "chat-message-user self-end"
                      : "chat-message-assistant"
                  } p-4 max-w-[80%]`}
                >
                  <p className="font-source whitespace-pre-line">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Ask a question about your contract..."
                  value={input}
                  onChange={handleInputChange}
                  className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-source"
                />
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white p-3 rounded-r-md transition"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Be specific with your questions for the best results</span>
                <span>Powered by Anthropic AI</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemo;
