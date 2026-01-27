import React, { useState, useRef, useEffect } from "react";
import { X, Send, User, Star, Clock, Award } from "lucide-react";
import { Lawyer } from "../data/lawyerData";
import { asiService, ASIMessage } from "../services/asiService";
import RazorpayButton from "./RazorpayButton";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface LawyerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyer: Lawyer;
}

const LawyerChatModal: React.FC<LawyerChatModalProps> = ({
  isOpen,
  onClose,
  lawyer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: `Hello! I'm ${lawyer.name}, a ${
          lawyer.specialization
        } lawyer with ${
          lawyer.experience
        } years of experience. I'm here to help you with legal questions and advice related to my area of expertise. Feel free to ask me anything about ${lawyer.specialization.toLowerCase()} matters, and I'll provide you with professional guidance.`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, lawyer, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const systemPrompt = `You are ${lawyer.name}, a ${
        lawyer.specialization
      } lawyer with ${lawyer.experience} years of experience. ${
        lawyer.description
      }. You speak ${lawyer.languages.join(
        ", "
      )}. Your achievements include: ${lawyer.achievements.join(", ")}.

IMPORTANT INSTRUCTIONS:
- Only answer questions related to legal matters and your area of specialization (${
        lawyer.specialization
      })
- If a query is not related to legal matters or doesn't match your expertise, politely decline and suggest consulting a lawyer with the appropriate specialty
- For invalid or non-legal queries, respond with: "I can only answer queries related to legal matters that match my profile as a ${
        lawyer.specialization
      } lawyer."
- Be professional, helpful, and knowledgeable in your responses
- Provide accurate legal information based on your expertise`;

      const chatMessages: ASIMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.map(
          (msg) => ({ role: msg.role, content: msg.content } as ASIMessage)
        ),
        { role: "user", content: inputMessage },
      ];

      // Create a temporary message for streaming
      const tempMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setStreamingContent("");

      let fullResponse = "";
      for await (const chunk of asiService.streamCompletion(chatMessages, {
        model: "asi1-mini",
        temperature: 0.7,
        max_tokens: 1000,
      })) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      // Update the message with the complete response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now(),
      };

      setMessages((prev) => prev.slice(0, -1).concat(assistantMessage));
      setStreamingContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePaymentSuccess = (response: any) => {
    alert(
      `Payment successful! Booking confirmed with ${lawyer.name}.\n\nPayment ID: ${response.razorpay_payment_id}`
    );
  };

  const handlePaymentFailure = (error: any) => {
    console.error("Payment failed:", error);
    alert("Payment failed. Please try again.");
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    alert("Something went wrong. Please try again later.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-6xl min-h-[600px] max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Chat with {lawyer.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Lawyer Info Sidebar */}
          <div className="w-[320px] min-w-[280px] max-w-[350px] p-4 lg:p-6 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="text-center mb-4 lg:mb-6">
              <img
                src={lawyer.image}
                alt={lawyer.name}
                className="w-20 h-20 lg:w-24 lg:h-24 rounded-full mx-auto mb-3 lg:mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900">
                {lawyer.name}
              </h3>
              <p className="text-sm text-gray-600">{lawyer.specialization}</p>
              <div className="flex items-center justify-center mt-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  {lawyer.rating}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Experience
                </div>
                <p className="text-sm font-medium">{lawyer.experience} years</p>
              </div>

              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Award className="w-4 h-4 mr-2" />
                  Description
                </div>
                <p className="text-sm">{lawyer.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Achievements</p>
                <div className="flex flex-wrap gap-1">
                  {lawyer.achievements.map((achievement, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-white rounded-full border"
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Languages</p>
                <p className="text-sm">{lawyer.languages.join(", ")}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-medium text-gray-500">
                    30 min consultation
                  </span>
                  <span className="text-base font-bold text-[#B58E2F]">
                    ${lawyer.price}
                  </span>
                </div>
                <RazorpayButton
                  amount={lawyer.price}
                  name="Legal Consultation"
                  description={`Consultation with ${lawyer.name}`}
                  lawyerId={lawyer.id.toString()}
                  lawyerName={lawyer.name}
                  buttonText="Hire Now"
                  buttonClassName="w-full bg-[#B58E2F] hover:bg-[#8B6B23] text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  icon={<User className="w-3.5 h-3.5" />}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={handlePaymentFailure}
                  onPaymentError={handlePaymentError}
                  prefill={{
                    name: "Test User",
                    email: "test@example.com",
                    contact: "9999999999",
                  }}
                  themeColor="#B58E2F"
                />
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p>Start a conversation with {lawyer.name}</p>
                  <p className="text-sm mt-2">
                    Ask about legal advice, their experience, or anything
                    related to {lawyer.specialization.toLowerCase()}.
                  </p>
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {index === messages.length - 1 &&
                      message.role === "assistant" &&
                      streamingContent
                        ? streamingContent
                        : message.content}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 lg:p-6 border-t border-gray-200 shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerChatModal;
