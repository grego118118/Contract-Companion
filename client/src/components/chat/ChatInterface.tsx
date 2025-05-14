import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Send, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  contractId: string;
  contractName: string;
  chatHistory?: ChatMessage[];
}

const ChatInterface = ({
  contractId,
  contractName,
  chatHistory = [],
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(chatHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // If no messages and no initial history, show welcome message
    if (messages.length === 0 && chatHistory.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your Contract Assistant. I've analyzed your contract "${contractName}". What would you like to know about your contract?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/query`, {
        query: input,
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: data.id || Date.now().toString() + "-response",
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `Let's start a new conversation about your contract "${contractName}". What would you like to know?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          <h3 className="font-merriweather font-semibold">Contract Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-accent border-none">
            {contractName}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetChat}
            className="text-white hover:bg-primary/80"
            title="New Conversation"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === "user"
                ? "chat-message-user self-end"
                : "chat-message-assistant"
            } p-4 max-w-[80%]`}
          >
            <p className="font-source whitespace-pre-line">{message.content}</p>
            <div className="text-xs text-gray-500 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message-assistant p-4 max-w-[80%] flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <p>Analyzing your contract...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Ask a question about your contract..."
            value={input}
            onChange={handleInputChange}
            disabled={loading}
            className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-source"
          />
          <Button
            type="submit"
            disabled={loading}
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
  );
};

export default ChatInterface;
