import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Scale,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  FileText,
  Paperclip,
  X,
  Send,
  MessageSquare
} from 'lucide-react';
import { summarizeDocument } from '../ai/geminiService';
import { getLegalDocumentSummaryPrompt } from '../prompts/legalSummarizationPrompt';
import { SiRobotframework } from "react-icons/si";
import { readFileAsBase64 } from '../utils/fileUtils';
import { asiService, ASIModel } from '../services/asiService';
import { asiDocumentChatService } from '../services/asiDocumentChatService';
import { useWallet } from '../contexts/WalletContext';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface Step {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: number;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const DocumentSummarizer: React.FC = () => {
  const { t } = useTranslation();

  const steps: Step[] = useMemo(() => [
    {
      title: t('summarisation.steps.upload.title'),
      description: t('summarisation.steps.upload.desc'),
      icon: Upload
    },
    {
      title: t('summarisation.steps.process.title'),
      description: t('summarisation.steps.process.desc'),
      icon: Scale
    },
    {
      title: t('summarisation.steps.review.title'),
      description: t('summarisation.steps.review.desc'),
      icon: MessageSquare
    }
  ], [t]);
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat functionality state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isProcessingMessage, setIsProcessingMessage] = useState<boolean>(false);
  const [documentContext, setDocumentContext] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [showChat, setShowChat] = useState<boolean>(false);

  // ASI integration state
  const [selectedASIModel, setSelectedASIModel] = useState<ASIModel>('asi1-mini');
  const [useASIForChat, setUseASIForChat] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const generateId = (): string => Math.random().toString(36).substr(2, 9);

  const detectDocumentType = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('contract') || lowerName.includes('agreement')) {
      return 'contract';
    } else if (lowerName.includes('brief') || lowerName.includes('motion') || lowerName.includes('petition')) {
      return 'legal_brief';
    } else if (lowerName.includes('statute') || lowerName.includes('act') || lowerName.includes('regulation')) {
      return 'legislation';
    } else if (lowerName.includes('memo') || lowerName.includes('opinion') || lowerName.includes('analysis')) {
      return 'legal_memo';
    }
    return '';
  };

  const { spendTokens } = useWallet();

  const scrollToBottom = (): void => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB} MB. Please upload a smaller file.`);
        return;
      }
      setFile(selectedFile);
      setActiveStep(1);
      setError(null);
      await processDocument(selectedFile);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB} MB. Please upload a smaller file.`);
        return;
      }
      setFile(droppedFile);
      setActiveStep(1);
      setError(null);
      await processDocument(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processDocument = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    setMessages([]);
    setChatHistory([]);
    setDocumentContext('');

    try {
      // Deduct tokens for document summarization
      const tokenResult = await spendTokens('document_summarization');
      if (!tokenResult.success) {
        setError(tokenResult.message || 'Failed to process payment');
        setIsProcessing(false);
        return;
      }

      // Get the appropriate prompt based on file type
      let documentType = "unknown";
      if (selectedFile.name.endsWith('.pdf')) documentType = "document";
      if (selectedFile.name.includes('contract')) documentType = "contract";
      if (selectedFile.name.includes('complaint') || selectedFile.name.includes('lawsuit')) documentType = "lawsuit";
      if (selectedFile.name.includes('will') || selectedFile.name.includes('testament')) documentType = "will";

      const prompt = getLegalDocumentSummaryPrompt(documentType);

      // Call the Gemini API through our service for summarization
      const result = await summarizeDocument(selectedFile, prompt);
      setSummary(result);

      // Initialize document context for chat
      const docType = detectDocumentType(selectedFile.name);
      const contextPrompt = `Analyze this document and provide a comprehensive understanding that can be used for answering questions. Focus on key information, entities, dates, and important details.`;

      const context = await initializeDocumentChat(selectedFile, contextPrompt);
      setDocumentContext(context);

      // Add welcome message
      const welcomeMessage: Message = {
        id: generateId(),
        type: 'bot',
        content: `Document analysis complete. The file "${selectedFile.name}" has been processed using ${useASIForChat ? 'ASI' : 'Gemini'} AI. You may now ask questions about the document content.`,
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);

      setActiveStep(2);
    } catch (error) {
      console.error('Error processing document:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const initializeDocumentChat = async (documentFile: File, initialPrompt: string): Promise<string> => {
    try {
      const base64Data = await readFileAsBase64(documentFile);
      const mimeType = documentFile.type || 'application/octet-stream';

      const apiKey = import.meta.env.VITE_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please check your environment variables.");
      }

      // Use the correct model name
      const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: initialPrompt },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const initialContext = data.candidates[0]?.content?.parts[0]?.text || '';
      return initialContext;

    } catch (error) {
      console.error('Error initializing document chat:', error);
      throw error;
    }
  };

  const sendChatMessage = async (
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    documentContext: string
  ): Promise<string> => {
    try {
      if (useASIForChat) {
        // Use ASI for chat functionality
        return await sendASIChatMessage(message, chatHistory, documentContext);
      } else {
        // Use Gemini for chat functionality (fallback)
        return await sendGeminiChatMessage(message, chatHistory, documentContext);
      }
    } catch (error) {
      console.error('Error in chat with document:', error);
      throw error;
    }
  };

  const sendASIChatMessage = async (
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    documentContext: string
  ): Promise<string> => {
    try {
      // Use the professional ASI document chat service
      const response = await asiDocumentChatService.generateDocumentResponse(
        message,
        chatHistory,
        documentContext,
        selectedASIModel
      );

      return response;

    } catch (error) {
      console.error('Error in ASI chat:', error);
      throw error;
    }
  };

  const sendGeminiChatMessage = async (
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    documentContext: string
  ): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please check your environment variables.");
      }

      // Use the correct model name
      const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const parts = [
        {
          text: `You are an AI assistant helping with document analysis. You have access to the following document context:\n\n${documentContext}\n\nWhen answering questions, refer to this context. If the answer cannot be found in the document context, say so clearly. Always be helpful, concise, and accurate.`
        }
      ];

      chatHistory.forEach(msg => {
        parts.push({
          text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        });
      });

      parts.push({ text: `User: ${message}` });
      parts.push({ text: "Assistant: " });

      const requestBody = {
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
      return responseText;

    } catch (error) {
      console.error('Error in Gemini chat:', error);
      throw error;
    }
  };

  const processUserMessage = async (userInput: string): Promise<void> => {
    setIsProcessingMessage(true);

    try {
      const response = await sendChatMessage(userInput, chatHistory, documentContext);

      const botMessage: Message = {
        id: generateId(),
        type: 'bot',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: generateId(),
        type: 'bot',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!inputValue.trim() || !documentContext) return;

    const userMessageId = generateId();
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setChatHistory(prev => [...prev, { role: 'user', content: inputValue }]);
    setInputValue('');

    await processUserMessage(inputValue);
  };

  const resetForm = () => {
    setFile(null);
    setSummary('');
    setActiveStep(0);
    setIsProcessing(false);
    setError(null);
    setMessages([]);
    setChatHistory([]);
    setDocumentContext('');
    setInputValue('');
    setShowChat(false);
    setSelectedASIModel('asi1-mini');
    setUseASIForChat(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden relative min-h-screen bg-gradient-to-br from-background via-background to-primary/10"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>

      {/* Background Decorative Elements */}
      <div className="absolute left-10 top-20 w-32 h-32 rounded-full blur-3xl bg-primary/5"></div>
      <div className="absolute right-20 top-60 w-40 h-40 rounded-full blur-3xl bg-secondary/10"></div>
      <div className="absolute left-20 bottom-40 w-36 h-36 rounded-full blur-3xl bg-primary/8"></div>

      <div className="container relative z-10 px-4 py-4 mx-auto max-w-7xl sm:py-8">
        {/* Header Section - Mobile Optimized */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 text-center sm:mb-12"
        >
          <div className="mb-4 sm:mb-8">
            <motion.div
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 mb-3 sm:mb-6 text-xs sm:text-sm rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
              whileHover={{ scale: 1.05 }}
            >
              <SiRobotframework className="mr-2 w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium text-primary">{t('summarisation.header.badge')}</span>
            </motion.div>
            <h1 className="mb-2 text-2xl font-bold tracking-wide sm:mb-4 sm:text-4xl lg:text-6xl">
              <span className="text-gray-900">{t('summarisation.header.title_prefix')}</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-secondary">
                {t('summarisation.header.title_highlight')}
              </span>
            </h1>
            <p className="px-4 mx-auto max-w-2xl text-base leading-relaxed text-gray-600 sm:text-xl">
              {t('summarisation.header.subtitle')}
            </p>
          </div>
        </motion.div>

        {/* Process Steps - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-16"
        >
          <div className="grid relative grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-3">
            {/* Connection Lines - Hidden on mobile */}
            <div className="hidden sm:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 transform -translate-y-1/2 z-0"></div>

            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                  whileHover={{ y: -4 }}
                  className={`relative z-10 p-4 sm:p-8 rounded-2xl transition-all duration-500 backdrop-blur-lg ${activeStep === index
                    ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary shadow-xl shadow-primary/20'
                    : activeStep > index
                      ? 'bg-gradient-to-br from-green-100/50 to-green-50/30 border-2 border-green-200 shadow-lg'
                      : 'bg-white/30 border-2 border-white/40 shadow-lg hover:bg-white/40'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-2 text-center sm:space-y-4">
                    <div className={`relative p-2 sm:p-4 rounded-full ${activeStep === index
                      ? 'bg-gradient-to-br from-primary to-primary-dark shadow-lg'
                      : activeStep > index
                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400'
                      }`}>
                      <step.icon className="w-4 h-4 text-white sm:w-6 sm:h-6" />
                      {activeStep > index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex absolute -top-1 -right-1 justify-center items-center w-4 h-4 bg-green-500 rounded-full sm:w-6 sm:h-6"
                        >
                          <CheckCircle className="w-2 h-2 text-white sm:w-4 sm:h-4" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-gray-900 sm:text-lg sm:mb-2">{step.title}</h3>
                      <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Content - Mobile Optimized */}
        <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-2">
          {/* Left Panel - Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="p-4 bg-gradient-to-br rounded-3xl border shadow-2xl backdrop-blur-xl sm:p-8 from-white/40 to-white/20 border-white/50"
          >
            <h2 className="flex items-center mb-4 space-x-3 text-lg font-bold text-gray-900 sm:mb-8 sm:text-2xl">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark">
                <Upload className="w-4 h-4 text-white sm:w-6 sm:h-6" />
              </div>
              <span>{t('summarisation.upload.title')}</span>
            </h2>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative p-6 text-center bg-gradient-to-br to-transparent rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer sm:p-12 border-primary/40 hover:border-primary/60 from-primary/5 hover:from-primary/10"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="absolute inset-0 bg-gradient-to-br via-transparent rounded-2xl from-primary/5 to-secondary/5"></div>
              <div className="relative z-10">
                <motion.div
                  className="flex justify-center items-center mx-auto mb-3 w-12 h-12 bg-gradient-to-br rounded-2xl shadow-xl sm:mb-6 sm:w-20 sm:h-20 from-primary to-primary-dark"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <Upload className="w-6 h-6 text-white sm:w-10 sm:h-10" />
                </motion.div>
                <h3 className="mb-1 text-sm font-bold text-gray-900 sm:mb-2 sm:text-lg">{t('summarisation.upload.drag_drop')}</h3>
                <p className="mb-4 text-xs text-gray-600 sm:mb-8 sm:text-base">or click to browse your files</p>
                <label className="inline-flex items-center px-4 py-2 text-xs text-white bg-gradient-to-r rounded-xl shadow-lg transition-all duration-300 cursor-pointer sm:px-8 sm:py-4 sm:text-base from-primary to-primary-dark hover:shadow-xl hover:scale-105">
                  <FileText className="mr-2 w-3 h-3 sm:mr-3 sm:w-5 sm:h-5" />
                  <span className="font-semibold">{t('summarisation.upload.browse')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </label>
                <p className="mt-3 text-xs text-gray-500 sm:mt-6 sm:text-sm">{t('summarisation.upload.supported')}</p>
              </div>
            </motion.div>

            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-between items-center p-3 mt-4 bg-gradient-to-r rounded-2xl border shadow-lg sm:p-6 sm:mt-8 from-primary/10 to-secondary/10 border-primary/20"
                >
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="p-2 bg-gradient-to-br rounded-xl sm:p-3 from-primary to-primary-dark">
                      <CheckCircle className="w-3 h-3 text-white sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-900 sm:text-base">{file.name}</span>
                      <span className="text-xs text-gray-600 sm:text-sm">{t('summarisation.upload.ready')}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel - Summary & Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="p-4 bg-gradient-to-br rounded-3xl border shadow-2xl backdrop-blur-xl sm:p-8 from-white/40 to-white/20 border-white/50"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-8">
              <h2 className="flex items-center space-x-3 text-lg font-bold text-gray-900 sm:text-2xl">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-secondary to-primary">
                  {showChat ? <MessageSquare className="w-4 h-4 text-white sm:w-6 sm:h-6" /> : <FileText className="w-4 h-4 text-white sm:w-6 sm:h-6" />}
                </div>
                <span>{showChat ? t('summarisation.panel.chat_title') : t('summarisation.panel.summary_title')}</span>
              </h2>
              {summary && documentContext && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowChat(!showChat)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-primary bg-primary/10 rounded-xl border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  {showChat ? t('summarisation.panel.view_summary') : t('summarisation.panel.ask_questions')}
                </motion.button>
              )}
            </div>

            {/* ASI Model Selection - Only show in chat mode */}
            {showChat && summary && documentContext && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20"
              >
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">{t('summarisation.ai.model_label')}</label>
                    <select
                      value={selectedASIModel}
                      onChange={(e) => setSelectedASIModel(e.target.value as ASIModel)}
                      className="px-3 py-1 text-sm rounded-lg border border-primary/30 bg-white/80 focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="asi1-mini">ASI1 Mini (Balanced)</option>
                      <option value="asi1-fast">ASI1 Fast (Quick)</option>
                      <option value="asi1-agentic">ASI1 Agentic (Advanced)</option>
                      <option value="asi1-extended">ASI1 Extended (Deep)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">{t('summarisation.ai.use_asi')}</label>
                    <button
                      onClick={() => setUseASIForChat(!useASIForChat)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useASIForChat ? 'bg-primary' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useASIForChat ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                    <span className="text-xs text-gray-600">
                      {useASIForChat ? 'ASI' : 'Gemini'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col justify-center items-center space-y-3 h-48 sm:space-y-6 sm:h-80"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r rounded-full animate-spin sm:w-20 sm:h-20 from-primary to-secondary"></div>
                    <div className="absolute inset-1 bg-white rounded-full sm:inset-2"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="mb-1 text-base font-bold sm:text-xl text-primary sm:mb-2">{t('summarisation.states.analyzing')}</h3>
                    <p className="text-sm text-gray-600 sm:text-base">{t('summarisation.states.analyzing_desc')}</p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 sm:p-8"
                >
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-red-500">
                      <AlertCircle className="w-4 h-4 text-white sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-bold text-red-800 sm:text-base sm:mb-2">{t('summarisation.states.error')}</h3>
                      <p className="mb-2 text-xs text-red-700 sm:text-sm sm:mb-4">{error}</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetForm}
                        className="px-3 py-1.5 sm:px-6 sm:py-3 text-xs sm:text-sm text-white rounded-xl transition-all bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg"
                      >
                        {t('summarisation.states.try_again')}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : showChat && summary && documentContext ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 sm:space-y-6 h-[400px] sm:h-[500px] flex flex-col"
                >
                  {/* Chat Messages */}
                  <div
                    ref={chatContainerRef}
                    className="overflow-y-auto flex-1 p-3 space-y-3 bg-gradient-to-br rounded-2xl border shadow-inner backdrop-blur-sm sm:p-4 from-white/60 to-white/40 border-white/60"
                  >
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: message.type === 'user' ? 50 : -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-lg ${message.type === 'user'
                              ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                              : 'bg-gradient-to-r from-white/80 to-white/60 text-gray-800 border border-white/60'
                              }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <span className={`text-xs mt-2 block ${message.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isProcessingMessage && (
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-lg bg-gradient-to-r from-white/80 to-white/60 border border-white/60">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full animate-bounce bg-primary"></div>
                              <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-600 sm:text-sm">{t('summarisation.ai.thinking')}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('summarisation.chat.placeholder')}
                        disabled={!documentContext || isProcessingMessage}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border backdrop-blur-sm transition-all sm:px-4 sm:py-3 border-white/40 bg-white/60 focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!inputValue.trim() || !documentContext || isProcessingMessage}
                        className={`p-2 sm:p-3 rounded-xl transition-all shadow-lg ${!inputValue.trim() || !documentContext || isProcessingMessage
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-xl text-white'
                          }`}
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              ) : summary ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 sm:space-y-6"
                >
                  <motion.div
                    className="p-3 sm:p-6 overflow-y-auto rounded-2xl bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm border border-white/60 shadow-inner max-h-[300px] sm:max-h-[500px] prose prose-sm max-w-none"
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 className="mb-2 text-base font-bold sm:mb-4 sm:text-xl text-[#9C7F00];" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="mb-1.5 sm:mb-3 text-sm sm:text-lg font-semibold text-[#9C7F00];" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base text-[#9C7F00;]" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-1.5 sm:mb-3 text-xs sm:text-base leading-relaxed text-gray-800" {...props} />
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </motion.div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const doc = new jsPDF();
                        
                        // Add title
                        doc.setFontSize(20);
                        doc.setTextColor(156, 127, 0); // Primary color
                        doc.text("Legal Document Summary", 20, 20);
                        
                        // Add content
                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        
                        // Split text to fit page width
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const margin = 20;
                        const maxWidth = pageWidth - (margin * 2);
                        
                        // Clean markdown symbols roughly for better PDF look
                        const cleanText = summary
                          .replace(/\*\*/g, "") // Remove bold
                          .replace(/#/g, "")    // Remove headers
                          .replace(/`/g, "")    // Remove code
                          .replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Remove links

                        const textLines = doc.splitTextToSize(cleanText, maxWidth);
                        
                        // Add text with pagination
                        let y = 40;
                        const lineHeight = 7;
                        
                        textLines.forEach((line: string) => {
                          if (y > 280) {
                            doc.addPage();
                            y = 20;
                          }
                          doc.text(line, margin, y);
                          y += lineHeight;
                        });
                        
                        doc.save("legal_summary.pdf");
                        toast.success("Summary downloaded as PDF");
                      }}
                      className="flex justify-center items-center px-4 py-2 space-x-2 text-xs text-white bg-gradient-to-r rounded-xl shadow-lg transition-all sm:px-6 sm:py-4 sm:space-x-3 sm:text-base from-secondary to-primary hover:shadow-xl"
                    >
                      <Download className="w-3 h-3 sm:w-5 sm:h-5" />
                      <span className="font-semibold">Download PDF</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetForm}
                      className="flex justify-center items-center px-4 py-2 space-x-2 text-xs text-gray-700 rounded-xl border border-gray-200 backdrop-blur-sm transition-all sm:px-6 sm:py-4 sm:space-x-3 sm:text-base bg-white/60 hover:bg-white/80"
                    >
                      <FileText className="w-3 h-3 sm:w-5 sm:h-5" />
                      <span className="font-semibold">New Document</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col justify-center items-center space-y-3 h-48 text-center sm:space-y-6 sm:h-80"
                >
                  <motion.div
                    className="flex justify-center items-center w-16 h-16 bg-gradient-to-br rounded-2xl sm:w-24 sm:h-24 from-primary/20 to-secondary/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="mb-1.5 sm:mb-3 text-base sm:text-xl font-bold text-gray-900">{t('summarisation.empty_state.title')}</h3>
                    <p className="mb-1 text-sm text-gray-600 sm:text-base sm:mb-2">{t('summarisation.empty_state.subtitle')}</p>
                    <p className="text-xs text-gray-500 sm:text-sm">{t('summarisation.empty_state.description')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentSummarizer;