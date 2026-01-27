import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { aiPrompt, GROQ_CONFIG, SUPPORTED_LANGUAGES } from '../ai/aiPrompt';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Groq from 'groq-sdk';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';
import { LuSend } from 'react-icons/lu';
import { ChevronDown, Maximize2, Minus, Trash2, X } from 'lucide-react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[]; }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const USE_GROQ = import.meta.env.VITE_GROQ_API_KEY ? true : false;

let groqClient: any = null;
if (USE_GROQ) {
  try {
    groqClient = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
      dangerouslyAllowBrowser: true,
      timeout: GROQ_CONFIG.TIMEOUT_MS
    });
  } catch (error) {
    console.error("Error initializing GROQ client:", error);
  }
}

type GroqRole = "system" | "user" | "assistant";

interface GroqMessage {
  role: GroqRole;
  content: string;
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        li: ({ ...props }) => <li className="list-item marker:text-primary" {...props} />,
        a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" {...props} />,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !match ? (
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono" {...props}>{children}</code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const LanguageSelector = ({
  selectedLanguage,
  onSelectLanguage
}: {
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg px-3 py-1.5"
      >
        <span>{SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage)?.nativeName || "English"}</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      {isOpen && (
        <div
          className="overflow-y-auto absolute right-0 z-50 mt-2 w-48 max-h-60 bg-white/90 rounded-lg shadow-lg backdrop-blur-md border border-white/50"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onSelectLanguage(language.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedLanguage === language.code ? 'bg-primary/10 font-medium' : ''}`}
            >
              <span className="block text-gray-800">{language.nativeName}</span>
              <span className="block text-xs text-gray-500">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingIndicator = () => (
  <div className="flex justify-center items-center p-3 space-x-1 text-gray-500 bg-gray-100 rounded-lg">
    <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{ animationDelay: "0ms" }}></div>
    <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{ animationDelay: "300ms" }}></div>
    <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{ animationDelay: "600ms" }}></div>
  </div>
);

const TypingIndicator = () => (
  <span className="inline-flex">
    <span className="animate-pulse">.</span>
    <span className="animate-pulse" style={{ animationDelay: "300ms" }}>.</span>
    <span className="animate-pulse" style={{ animationDelay: "600ms" }}>.</span>
  </span>
);

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const baseClasses = "flex items-center justify-center font-medium rounded-lg transition-colors";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark disabled:bg-gray-300",
    secondary: "bg-gray text-gray-800 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400",
    ghost: "bg-transparent text-white hover:bg-white/20 disabled:text-gray-300"
  };
  const sizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-2.5"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const chatWindowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2, ease: 'easeOut' } },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }
};

const messageVariants: Variants = {
  hidden: (message: Message) => ({
    opacity: 0,
    x: message.sender === 'user' ? 20 : -20,
    scale: 0.9
  }),
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

const toggleButtonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

const LegaleChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang);
      if (isSupported) setSelectedLanguage(browserLang);
    };
    detectLanguage();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const formatResponse = (content: string): string => {
    if (!content) return "I apologize, but I couldn't generate a response. Please try again.";
    let cleanedContent = content.trim();
    cleanedContent = cleanedContent.replace(/```\s*\n([\s\S]*?)\n```/g, (_match, codeContent) => {
      return '```text\n' + codeContent + '\n```';
    });
    return cleanedContent;
  };

  const generateGroqMessages = (userInput: string): GroqMessage[] => {
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
    const languageInstruction = selectedLanguage !== 'en'
      ? `\n\nIMPORTANT: The user's language is ${langName}. Please respond in ${langName}.`
      : '';
    return [
      { role: "system", content: aiPrompt + languageInstruction },
      { role: "user", content: userInput }
    ];
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input.trim(), sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response: string;

      // Try MeTTa service first
      try {
        const mettaResponse = await handleSendWithMeTTa(userMessage.text);
        response = mettaResponse;
        const aiMessage = { text: response, sender: 'ai' as const };
        setMessages(prev => [...prev, aiMessage]);
      } catch (mettaError) {
        console.log('MeTTa service failed, falling back to original API:', mettaError);

        // Fallback to original API
        if (USE_GROQ) {
          const streamPlaceholder = { text: '', sender: 'ai' as const };
          setMessages(prev => [...prev, streamPlaceholder]);
          response = await handleStreamWithGroq(userMessage.text);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = response;
            return newMessages;
          });
        } else {
          response = await handleSendWithOriginalApi(userMessage.text);
          const aiMessage = { text: response, sender: 'ai' as const };
          setMessages(prev => [...prev, aiMessage]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred. Please try again.';
      const aiErrorMessage = { text: `I apologize, but I encountered an error: ${errorMessage}`, sender: 'ai' as const };
      setMessages(prev => [...prev, aiErrorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleStreamWithGroq = async (userInput: string): Promise<string> => {
    if (!groqClient) throw new Error("GROQ client not initialized");
    setIsStreaming(true);
    setStreamingContent('');

    const messages = generateGroqMessages(userInput);

    try {
      const stream = await groqClient.chat.completions.create({
        messages,
        model: GROQ_CONFIG.DEFAULT_MODEL,
        temperature: GROQ_CONFIG.GENERATION_PARAMS.temperature,
        max_tokens: GROQ_CONFIG.GENERATION_PARAMS.max_tokens,
        top_p: GROQ_CONFIG.GENERATION_PARAMS.top_p,
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setStreamingContent(fullResponse);
      }
      return formatResponse(fullResponse);
    } catch (error) {
      console.error('Primary model error, trying fallback:', error);
      setStreamingContent('');
      const fallbackStream = await groqClient.chat.completions.create({
        messages,
        model: GROQ_CONFIG.FALLBACK_MODEL,
        temperature: GROQ_CONFIG.GENERATION_PARAMS.temperature,
        max_tokens: GROQ_CONFIG.GENERATION_PARAMS.max_tokens,
        top_p: GROQ_CONFIG.GENERATION_PARAMS.top_p,
        stream: true
      });

      let fallbackResponse = '';
      for await (const chunk of fallbackStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fallbackResponse += content;
        setStreamingContent(fallbackResponse);
      }
      return formatResponse(fallbackResponse);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendWithMeTTa = async (userInput: string): Promise<string> => {
    try {
      const response = await axios.post(
        'http://localhost:5001/api/metta-query',
        { query: userInput },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 second timeout for MeTTa service
        }
      );

      if (!response.data) throw new Error('No data received from MeTTa service');

      // Handle MeTTa response format
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (response.data.selected_question && response.data.humanized_answer) {
        return `**${response.data.selected_question}**\n\n${response.data.humanized_answer}`;
      } else if (typeof response.data === 'string') {
        return response.data;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.error('MeTTa service error:', error);
      throw error;
    }
  };

  const handleSendWithOriginalApi = async (userInput: string): Promise<string> => {
    if (!import.meta.env.VITE_API_KEY || !import.meta.env.VITE_API_URL) {
      throw new Error("API credentials not configured");
    }

    const response = await axios.post(
      import.meta.env.VITE_API_URL,
      { prompt: userInput, system_prompt: aiPrompt },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        timeout: GROQ_CONFIG.TIMEOUT_MS
      }
    );

    if (!response.data) throw new Error('No data received from API');
    let content = '';
    if (response.data.content) content = response.data.content;
    else if (response.data.choices && response.data.choices[0]?.message?.content) content = response.data.choices[0].message.content;
    else if (typeof response.data === 'string') content = response.data;
    else throw new Error('Unexpected response format');
    return formatResponse(content);
  };

  const getSampleQuestions = (): string[] => {
    const questions: Record<string, string[]> = {
      'en': ['What are my rights if arrested?', 'How to file an FIR in India?', 'Explain divorce procedure in India'],
      'hi': ['गिरफ्तारी के समय मेरे क्या अधिकार हैं?', 'भारत में FIR कैसे दर्ज करें?', 'भारत में तलाक की प्रक्रिया समझाएं'],
      'bn': ['গ্রেপ্তার হলে আমার অধিকারগুলি কী?', 'ভারতে FIR কীভাবে দায়ের করবেন?', 'ভারতে বিবাহবিচ্ছেদের পদ্ধতি ব্যাখ্যা করুন']
    };
    return questions[selectedLanguage] || questions['en'];
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
    if (!isLoading) setTimeout(() => handleSendMessage(), 100);
  };

  const handleClearChat = () => setMessages([]);

  const getPlaceholderText = (): string => {
    const placeholders: Record<string, string> = {
      'en': 'Ask about legal matters...',
      'hi': 'कानूनी मामलों के बारे में पूछें...',
      'bn': 'আইনি বিষয়ে জিজ্ঞাসা করুন...'
    };
    return placeholders[selectedLanguage] || placeholders['en'];
  };

  const renderStreamingText = (text: string) => {
    if (!text) return <TypingIndicator />;
    return (
      <>
        <MarkdownRenderer content={text} />
        <TypingIndicator />
      </>
    );
  };

  return (
    <motion.div
      className="fixed right-4 bottom-4 z-40 sm:right-8 sm:bottom-8"
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            layout
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`rounded-xl shadow-2xl flex flex-col overflow-hidden max-w-[550px] w-full h-[70vh] ${isExpanded ? 'md:max-w-[800px] md:h-[90vh]' : ''} bg-white/20 backdrop-blur-xl border border-white/50`}
          >
            {/* Header */}
            <motion.div
              className="flex justify-between items-center p-4 text-white bg-gradient-to-r from-primary to-primary-dark rounded-t-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center w-10 h-10 font-bold bg-white/30 rounded-full text-primary">
                  AI
                </div>
                <div>
                  <h3 className="font-semibold">LegalEase Assistant</h3>
                  <p className="text-xs opacity-80">Your legal guide</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <LanguageSelector selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  aria-label="Clear chat"
                >
                  {/* Trash/clear icon */}
                  <span className="w-5 h-5">
                    <Trash2 className="w-5 h-5" />
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? (
                    <Minus className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            {/* Messages area */}
            <div className="overflow-y-auto flex-1 p-4 bg-white/50">
              {!USE_GROQ && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 text-center text-red-500 bg-red-100 rounded-lg"
                >
                  <p>API configuration missing. Chat functionality is disabled.</p>
                  <p className="mt-2 text-sm">Please check your environment variables.</p>
                </motion.div>
              )}
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    custom={message}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                    >
                      {index === messages.length - 1 && message.sender === 'ai' && isStreaming ? (
                        renderStreamingText(streamingContent)
                      ) : (
                        <MarkdownRenderer content={message.text} />
                      )}
                    </motion.div>
                  </motion.div>
                ))}
                <AnimatePresence>
                  {isLoading && !isStreaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <LoadingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-white/50 border-t border-white/30"
            >
              <div className="flex space-x-2">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/30 border border-white/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={!USE_GROQ || isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage()}
                  disabled={!USE_GROQ || isLoading || !input.trim()}
                  className="flex justify-center items-center px-4 py-2 font-medium text-white rounded-lg bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <LuSend className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {getSampleQuestions().map((question, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuestionClick(question)}
                    className="text-xs bg-white/30 hover:bg-white/40 text-gray-800 px-3 py-1 rounded-full truncate max-w-[200px]"
                    disabled={!USE_GROQ || isLoading}
                  >
                    {question}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            key="toggle-button"
            variants={toggleButtonVariants}
            onClick={() => setIsOpen(true)}
            className="p-3 text-white rounded-full shadow-lg transition-colors bg-primary hover:bg-primary-dark"
            aria-label="Open chat"
          >
            <IoChatboxEllipsesOutline className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LegaleChatbot;