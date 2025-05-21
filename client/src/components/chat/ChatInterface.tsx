import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  Tag, 
  Bookmark, 
  Clock,
  Calendar,
  BookOpen,
  Users,
  Scale,
  Briefcase,
  Heart,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Topic categories with their icons and descriptions
const TOPIC_CATEGORIES = {
  WAGES: { icon: <Briefcase className="h-3 w-3 mr-1" />, label: "Wages", color: "bg-blue-100 text-blue-800" },
  BENEFITS: { icon: <Heart className="h-3 w-3 mr-1" />, label: "Benefits", color: "bg-pink-100 text-pink-800" },
  TIME_OFF: { icon: <Calendar className="h-3 w-3 mr-1" />, label: "Time Off", color: "bg-green-100 text-green-800" },
  HOURS: { icon: <Clock className="h-3 w-3 mr-1" />, label: "Hours", color: "bg-purple-100 text-purple-800" },
  SENIORITY: { icon: <Users className="h-3 w-3 mr-1" />, label: "Seniority", color: "bg-yellow-100 text-yellow-800" },
  GRIEVANCE: { icon: <Scale className="h-3 w-3 mr-1" />, label: "Grievance", color: "bg-red-100 text-red-800" },
  TERMS: { icon: <BookOpen className="h-3 w-3 mr-1" />, label: "Terms", color: "bg-indigo-100 text-indigo-800" },
  OTHER: { icon: <AlertCircle className="h-3 w-3 mr-1" />, label: "Other", color: "bg-gray-100 text-gray-800" }
};

interface TopicCategory {
  key: keyof typeof TOPIC_CATEGORIES;
  confidence: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  categories?: TopicCategory[];
  rating?: "helpful" | "unhelpful";
  saved?: boolean;
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const commonQuestions = [
    "What benefits am I entitled to?",
    "How does vacation time accrue?",
    "What's the grievance procedure?",
    "How is overtime calculated?",
    "What are my rights regarding seniority?"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // If no messages and no initial history, show welcome message
    if (messages.length === 0 && (!chatHistory || chatHistory.length === 0)) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your Contract Assistant. I've analyzed your contract "${contractName}". What would you like to know about your contract?`,
          timestamp: new Date(),
          categories: [{ key: "OTHER", confidence: 1 }]
        },
      ]);
      setShowSuggestions(true);
    } else if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory, contractName, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Determine the most likely topic categories based on query content
  const determineCategories = (query: string): TopicCategory[] => {
    const lowerQuery = query.toLowerCase();
    const categories: TopicCategory[] = [];
    
    if (lowerQuery.includes('pay') || lowerQuery.includes('salary') || lowerQuery.includes('wage') || 
        lowerQuery.includes('compensation') || lowerQuery.includes('bonus') || lowerQuery.includes('overtime')) {
      categories.push({ key: 'WAGES', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('health') || lowerQuery.includes('insurance') || lowerQuery.includes('dental') || 
        lowerQuery.includes('vision') || lowerQuery.includes('retirement') || lowerQuery.includes('pension') ||
        lowerQuery.includes('benefits')) {
      categories.push({ key: 'BENEFITS', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('vacation') || lowerQuery.includes('sick') || lowerQuery.includes('leave') || 
        lowerQuery.includes('time off') || lowerQuery.includes('pto') || lowerQuery.includes('holiday')) {
      categories.push({ key: 'TIME_OFF', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('hour') || lowerQuery.includes('shift') || lowerQuery.includes('schedule') || 
        lowerQuery.includes('workday') || lowerQuery.includes('workweek')) {
      categories.push({ key: 'HOURS', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('seniority') || lowerQuery.includes('layoff') || lowerQuery.includes('tenure') || 
        lowerQuery.includes('years of service')) {
      categories.push({ key: 'SENIORITY', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('grievance') || lowerQuery.includes('complaint') || lowerQuery.includes('dispute') || 
        lowerQuery.includes('arbitration') || lowerQuery.includes('mediation')) {
      categories.push({ key: 'GRIEVANCE', confidence: 0.9 });
    }
    
    if (lowerQuery.includes('term') || lowerQuery.includes('agreement') || lowerQuery.includes('contract') || 
        lowerQuery.includes('duration') || lowerQuery.includes('extend') || lowerQuery.includes('renew')) {
      categories.push({ key: 'TERMS', confidence: 0.9 });
    }
    
    // If no categories were identified, use OTHER
    if (categories.length === 0) {
      categories.push({ key: 'OTHER', confidence: 0.7 });
    }
    
    return categories;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput || loading) return;

    // Hide suggestions when user submits a query
    setShowSuggestions(false);

    const categories = determineCategories(currentInput);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
      categories: categories
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiRequest("POST", `/api/contracts/${contractId}/query`, {
        query: currentInput,
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
        categories: categories
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

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    setShowSuggestions(false);
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `Let's start a new conversation about your contract "${contractName}". What would you like to know?`,
        timestamp: new Date(),
        categories: [{ key: "OTHER", confidence: 1 }]
      },
    ]);
    setShowSuggestions(true);
  };

  const rateMessage = (messageId: string, rating: "helpful" | "unhelpful") => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, rating } 
          : message
      )
    );
    
    // In a real application, you'd save this rating to the backend
    toast({
      title: rating === "helpful" ? "Response marked as helpful" : "Response marked as unhelpful",
      description: "Thank you for your feedback",
    });
  };

  const toggleSavedMessage = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, saved: !message.saved } 
          : message
      )
    );
    
    // Find the message
    const message = messages.find(m => m.id === messageId);
    
    // In a real application, you'd save this to the backend
    if (message) {
      toast({
        title: message.saved ? "Response unsaved" : "Response saved",
        description: message.saved 
          ? "The response has been removed from your saved items" 
          : "The response has been saved for future reference",
      });
    }
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
            className={cn(
              message.role === "user"
                ? "chat-message-user self-end bg-primary text-white rounded-lg rounded-br-none"
                : "chat-message-assistant bg-white border shadow-sm rounded-lg rounded-bl-none",
              message.saved && message.role === "assistant" ? "border-l-4 border-l-accent" : "",
              "p-4 max-w-[85%]"
            )}
          >
            {/* Categories badges for user messages */}
            {message.role === "user" && message.categories && message.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {message.categories.map((category) => (
                  <Badge key={category.key} variant="outline" className="text-xs bg-white/20 text-white border-none flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {TOPIC_CATEGORIES[category.key].label}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Message content */}
            <div className="font-source whitespace-pre-line" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/# (.*?)(\n|$)/g, '<h3 class="text-lg font-bold mb-2">$1</h3>').replace(/## (.*?)(\n|$)/g, '<h4 class="text-md font-bold mb-1">$1</h4>').replace(/- (.*?)(\n|$)/g, '<li class="ml-4">$1</li>') }} />
            
            {/* Message footer: timestamp, categories, and actions */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              
              {/* Actions for assistant messages: rating and save */}
              {message.role === "assistant" && (
                <div className="flex items-center space-x-2">
                  {/* Rating buttons */}
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0", 
                        message.rating === "helpful" ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                      )}
                      onClick={() => rateMessage(message.id, "helpful")}
                      title="Mark as helpful"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0", 
                        message.rating === "unhelpful" ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                      )}
                      onClick={() => rateMessage(message.id, "unhelpful")}
                      title="Mark as unhelpful"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* Save button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0", 
                      message.saved ? "text-accent" : "text-gray-400 hover:text-gray-600"
                    )}
                    onClick={() => toggleSavedMessage(message.id)}
                    title={message.saved ? "Unsave response" : "Save response"}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Categories for assistant messages */}
            {message.role === "assistant" && message.categories && message.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.categories.map((category) => (
                  <Badge 
                    key={category.key} 
                    variant="outline" 
                    className={cn(
                      "text-xs border-none flex items-center",
                      TOPIC_CATEGORIES[category.key].color
                    )}
                  >
                    {TOPIC_CATEGORIES[category.key].icon}
                    {TOPIC_CATEGORIES[category.key].label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="chat-message-assistant bg-white border shadow-sm rounded-lg rounded-bl-none p-4 max-w-[85%] flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <p>Analyzing your contract...</p>
          </div>
        )}
        
        {/* Suggested questions */}
        {showSuggestions && !loading && (
          <div className="w-full max-w-3xl mx-auto mt-4 mb-2">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Suggested questions:</h4>
            <div className="flex flex-wrap gap-2">
              {commonQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="bg-white text-sm text-left justify-start h-auto py-2"
                  onClick={() => handleSuggestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <Input
            type="text"
            id="chat-input"
            name="chat-input"
            aria-label="Ask a question about your contract"
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
