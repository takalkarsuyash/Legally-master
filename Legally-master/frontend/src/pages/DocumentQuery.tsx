import {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  FC,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Paperclip,
  X,
  Send,
  AlertCircle,
  User,
  Star,
  MapPin,
  Clock,
  Brain,
  Database,
  ArrowRight,
  Zap,
  Sparkles,
  Phone,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MdPsychology } from "react-icons/md";
import { AgentProgress, LawyerCard } from "../ai/toolCall";
import { StreamingService } from "../ai/streamingService";
import { ASIStreamingService } from "../ai/asiStreamingService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RazorpayButton from "../components/RazorpayButton";
import { useWallet } from "../contexts/WalletContext";
import { extractTextFromPDF } from "../utils/pdfUtils";

type MessageType = "user" | "bot" | "system";
type FileType = File & { preview?: string };

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  lawyerCards?: LawyerCard[];
  queryContext?: {
    specializations: string[];
    confidence: number;
    reasoning: string;
  };
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const DocumentQuery: FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [file, setFile] = useState<FileType | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isProcessingMessage, setIsProcessingMessage] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState<boolean>(false);
  const [agentProgress, setAgentProgress] = useState<AgentProgress | null>(
    null,
  );
  const [showA2AFlow, setShowA2AFlow] = useState<boolean>(false);
  const [streamingService] = useState<StreamingService>(new StreamingService());
  const [asiStreamingService] = useState<ASIStreamingService>(
    new ASIStreamingService(),
  );
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(
    null,
  );
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [showA2AModal, setShowA2AModal] = useState<boolean>(false);
  const [useASI, setUseASI] = useState<boolean>(true); // Toggle between Gemini and ASI
  const [isChatMode, setIsChatMode] = useState<boolean>(false); // UI State for ChatGPT-transition

  const [documentData, setDocumentData] = useState<{
    content: string;
    type: "text" | "image";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { spendTokens } = useWallet();

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const generateId = (): string => Math.random().toString(36).substr(2, 9);

  const detectDocumentType = (fileName: string, mimeType: string): string => {
    const lowerName = fileName.toLowerCase();

    if (mimeType.startsWith("image/")) {
      return "scanned_document";
    }

    if (lowerName.includes("contract") || lowerName.includes("agreement")) {
      return "contract";
    } else if (
      lowerName.includes("brief") ||
      lowerName.includes("motion") ||
      lowerName.includes("petition")
    ) {
      return "legal_brief";
    } else if (
      lowerName.includes("statute") ||
      lowerName.includes("act") ||
      lowerName.includes("regulation")
    ) {
      return "legislation";
    } else if (
      lowerName.includes("memo") ||
      lowerName.includes("opinion") ||
      lowerName.includes("analysis")
    ) {
      return "legal_memo";
    }
    return "";
  };

  const scrollToBottom = (): void => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const readFileContent = (
    file: File,
  ): Promise<{ content: string; type: "text" | "image" }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.startsWith("image/")) {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve({ content: event.target.result as string, type: "image" });
          } else {
            reject(new Error("Failed to read image file"));
          }
        };
        reader.readAsDataURL(file); // Read images as DataURL (base64)
      } else {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve({ content: event.target.result as string, type: "text" });
          } else {
            reject(new Error("Failed to read text file"));
          }
        };
        reader.readAsText(file); // Read text files as Text
      }
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Only scroll when new messages are added, not on every message change

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `File size exceeds ${MAX_FILE_SIZE_MB} MB. Please upload a smaller file.`,
        );
        return;
      }
      setError(null);
      const typedFile = selectedFile as FileType;
      typedFile.preview = URL.createObjectURL(selectedFile);

      setFile(typedFile);
      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });
      setIsFilePreviewOpen(true);

      // Simulate document processing (frontend-only)
      await processDocument(selectedFile);
    }
  };

  const processDocument = async (documentFile: File): Promise<void> => {
    setMessages([]);
    setIsProcessingFile(true);
    setError(null);
    setDocumentData(null);

    try {
      // Deduct tokens for document query
      const tokenResult = await spendTokens("document_query");
      if (!tokenResult.success) {
        setError(tokenResult.message || "Failed to process payment");
        setIsProcessingFile(false);
        return;
      }

      const docType = detectDocumentType(documentFile.name, documentFile.type);

      const loadingMsgId = generateId();
      setMessages([
        {
          id: loadingMsgId,
          type: "system",
          content: documentFile.type.startsWith("image/")
            ? "Scanning document image..."
            : "Reading document text...",
          timestamp: Date.now(),
        },
      ]);

      // Read document content
      try {
        let data;
        if (documentFile.type === "application/pdf") {
          // Extract text from PDF
          const pdfText = await extractTextFromPDF(documentFile);
          data = {
            content: `[PDF CONTENT - ${documentFile.name}]\n${pdfText}`,
            type: "text" as const,
          };
        } else {
          data = await readFileContent(documentFile);
        }
        setDocumentData(data);
        console.log(`Document processed: ${data.type}`);
      } catch (err) {
        console.warn("Failed to read document content.", err);
        setDocumentData(null);
      }

      // Simulate parsing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsgId));

      const welcomeMessage: Message = {
        id: generateId(),
        type: "bot",
        content: `Document analyzed successfully! I've processed "${documentFile.name}" (${docType || "document"}). I can answer questions based on its content.`,
        timestamp: Date.now(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Error processing document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process document",
      );
      setMessages([]);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processUserMessage = async (userInput: string): Promise<void> => {
    // Input validation
    if (
      !userInput ||
      typeof userInput !== "string" ||
      userInput.trim().length === 0
    ) {
      setError("Please enter a valid legal question.");
      return;
    }

    setIsProcessingMessage(true);
    setIsStreaming(true);
    setError(null);
    setShowA2AFlow(true);

    try {
      // Deduct tokens for document query interaction
      const tokenResult = await spendTokens("document_query");
      if (!tokenResult.success) {
        setError(tokenResult.message || "Failed to process payment");
        setIsProcessingMessage(false);
        setIsProcessingMessage(false);
        setIsStreaming(false);
        setShowA2AFlow(false);
        return;
      }

      // Create streaming message
      const streamingMsg: Message = {
        id: generateId(),
        type: "bot",
        content: "",
        timestamp: Date.now(),
      };
      setStreamingMessage(streamingMsg);

      if (useASI) {
        // Use ASI agents for A2A protocol
        await processWithASI(userInput, streamingMsg);
      } else {
        // Use original Gemini agents
        await processWithGemini(userInput, streamingMsg);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: Message = {
        id: generateId(),
        type: "bot",
        content:
          "Sorry, I encountered an error processing your message. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessingMessage(false);
      setIsStreaming(false);
      setStreamingMessage(null);
      setAgentProgress(null);
      setShowA2AFlow(false);
    }
  };

  const processWithASI = async (
    userInput: string,
    streamingMsg: Message,
  ): Promise<void> => {
    try {
      // Stream David's ASI analysis
      setAgentProgress({
        stage: "david",
        message: t("document_query.progress.david_analyzing_asi"),
        progress: 0,
        toolCalls: [],
      });

      let davidResult: any = null;
      let davidError = false;
      let davidContent = "";
      let andrewError = false;

      console.log(
        "Starting ASI Stream with Document Data:",
        documentData ? "Present" : "NULL",
      );
      let currentContent = "";
      let isAndrewStreaming = false;

      try {
        // streamAutoA2AFlow handles BOTH David (Analysis) and Andrew (Presentation)
        for await (const chunk of asiStreamingService.streamAutoA2AFlow(
          userInput,
          documentData,
        )) {
          // Update progress UI
          setAgentProgress((prev) =>
            prev ? { ...prev, progress: chunk.progress } : null,
          );

          // Capture David's result when available (this marks the END of David's stream)
          if (chunk.davidResult) {
            davidResult = chunk.davidResult;
            isAndrewStreaming = true; // Switch to Andrew mode for SUBSEQUENT chunks

            // Start showing "Andrew" stage UI
            setAgentProgress({
              stage: "andrew",
              message: t("document_query.progress.andrew_formatting_asi"),
              progress: 50,
              toolCalls: [],
            });

            // Reset content accumulator for Andrew's turn - user wants Andrew to REPLACE David
            currentContent = "";
            setStreamingMessage((prev) =>
              prev ? { ...prev, content: "" } : null,
            );

            continue;
          }

          // Display content from BOTH David and Andrew (sequentially)
          if (chunk.content) {
            currentContent += chunk.content;
            setStreamingMessage((prev) =>
              prev ? { ...prev, content: currentContent } : null,
            );
          }

          // Finalize when the entire flow is complete
          if (chunk.isComplete && chunk.andrewMessage) {
            const finalMessage: Message = {
              ...streamingMsg,
              id: generateId(), // Generate new ID to prevent key collision with streaming message
              content: currentContent,
              lawyerCards: [], // Pure chatbot mode
              queryContext: davidResult?.queryContext
                ? {
                    ...davidResult.queryContext,
                    specializations: davidResult.queryContext
                      .detectedSpecializations || ["General Legal"],
                  }
                : undefined,
            };

            setMessages((prevMessages) => [...prevMessages, finalMessage]);
            setStreamingMessage(null);
          }
        }
      } catch (error) {
        console.error("ASI Streaming error:", error);
        andrewError = true;
        if (!davidResult) davidError = true;

        // Only show fallback if we genuinely failed to get valid content
        if (!currentContent) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              type: "bot",
              content: t("document_query.chat.error_generic"),
              timestamp: Date.now(),
            },
          ]);
        }
      }

      // If both ASI agents failed, show error message
      if (davidError && andrewError) {
        const errorMessage: Message = {
          id: generateId(),
          type: "bot",
          content: t("document_query.chat.error_tech"),
          timestamp: Date.now(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error("ASI processing error:", error);
      throw error;
    }
  };

  const processWithGemini = async (
    userInput: string,
    streamingMsg: Message,
  ): Promise<void> => {
    try {
      // Stream David's analysis
      setAgentProgress({
        stage: "david",
        message: t("document_query.progress.david_analyzing_gemini"),
        progress: 0,
        toolCalls: [],
      });

      let davidResult: any = null;
      let davidError = false;
      let davidContent = "";

      try {
        for await (const chunk of streamingService.streamDavidAnalysis(
          userInput,
        )) {
          // Show David's analysis in real-time
          if (chunk.content) {
            davidContent += chunk.content;
            setStreamingMessage((prev) =>
              prev ? { ...prev, content: davidContent } : null,
            );
          }
          setAgentProgress((prev) =>
            prev ? { ...prev, progress: chunk.progress } : null,
          );

          if (chunk.isComplete) {
            davidResult = chunk.davidResult;
          }
        }
      } catch (error) {
        console.error("David streaming error:", error);
        davidError = true;
      }

      // Stream Andrew's presentation
      setAgentProgress({
        stage: "andrew",
        message: t("document_query.progress.andrew_formatting_gemini"),
        progress: 0,
        toolCalls: [],
      });

      // Ensure we have a valid David result for Andrew
      if (!davidResult || davidError) {
        console.warn("DocumentQuery: Using fallback David result");
        davidResult = {
          queryContext: {
            originalQuery: userInput,
            reasoning:
              "I have analyzed your legal question and found relevant information.",
            detectedSpecializations: ["General Legal"],
            confidence: 75,
          },
          matchedLawyers: [],
          recommendations: {
            primaryMatch: null,
            alternativeMatches: [],
            whyThisMatch: "AI-powered analysis",
          },
        };
      }

      let andrewError = false;
      let andrewContent = ""; // Start fresh for Andrew

      // Reset streaming message for Andrew's turn
      setStreamingMessage((prev) => (prev ? { ...prev, content: "" } : null));

      try {
        for await (const chunk of streamingService.streamAndrewPresentation(
          davidResult,
          userInput,
        )) {
          if (chunk.content) {
            andrewContent += chunk.content;
            setStreamingMessage((prev) =>
              prev ? { ...prev, content: andrewContent } : null,
            );
          }
          setAgentProgress((prev) =>
            prev ? { ...prev, progress: chunk.progress } : null,
          );

          if (chunk.isComplete) {
            // Finalize the message with real lawyer cards from Andrew
            const finalMessage: Message = {
              ...streamingMsg,
              id: generateId(), // Generate new ID to prevent key collision with streaming message
              content: andrewContent, // Use accumulated content
              lawyerCards: chunk.andrewMessage?.lawyerCards || [],
              queryContext: davidResult?.queryContext
                ? {
                    ...davidResult.queryContext,
                    specializations: davidResult.queryContext
                      .detectedSpecializations || ["General Legal"],
                  }
                : undefined,
            };

            setMessages((prevMessages) => [...prevMessages, finalMessage]);
            setStreamingMessage(null);
          }
        }
      } catch (error) {
        console.error("Andrew streaming error:", error);
        andrewError = true;
      }

      // If both agents failed, show error message
      if (davidError && andrewError) {
        const errorMessage: Message = {
          id: generateId(),
          type: "bot",
          content: t("document_query.chat.error_tech"),
          timestamp: Date.now(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Gemini processing error:", error);
      throw error;
    }
  };

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      if (!inputValue.trim()) return;

      const userMessageId = generateId();
      const userMessage: Message = {
        id: userMessageId,
        type: "user",
        content: inputValue,
        timestamp: Date.now(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputValue("");

      await processUserMessage(inputValue);
    },
    [inputValue, processUserMessage],
  );

  const removeFile = (): void => {
    setFileInfo(null);
    setIsFilePreviewOpen(false);
    setMessages([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const LawyerCardComponent: FC<{ card: LawyerCard }> = ({ card }) => {
    const { lawyer, matchScore, whyRecommended, isPrimary } = card;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border-2 transition-all ${
          isPrimary
            ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5"
            : "border-gray-200 bg-white hover:border-primary/30"
        }`}
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg">
            {lawyer.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900">{lawyer.name}</h3>
              {isPrimary && (
                <span className="px-2 py-1 text-xs font-semibold bg-primary text-white rounded-full">
                  {t("document_query.lawyer_card.recommended")}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                {lawyer.rating}/5
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                {lawyer.experience}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                {lawyer.location}
              </div>
            </div>

            <div className="mb-3">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                {lawyer.specialization}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{lawyer.description}</p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-medium">
                  {t("document_query.lawyer_card.match")} {matchScore}%
                </span>
              </div>
              <div className="text-sm font-medium text-primary">
                {lawyer.website ? (
                  <a
                    href={`https://${lawyer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-4 h-4" /> {lawyer.website}
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">
                    {t("document_query.lawyer_card.website_na")}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <strong>{t("document_query.lawyer_card.why_recommended")}</strong>{" "}
              {whyRecommended}
            </div>

            {lawyer.achievements.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {lawyer.achievements.slice(0, 2).map((achievement, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    {achievement}
                  </span>
                ))}
              </div>
            )}

            {/* Contact Info */}
            <div className="mt-4 p-3 bg-gray-50/80 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center space-x-2 text-gray-700 font-medium">
                <Phone className="w-4 h-4 text-primary" />
                <span>{lawyer.phone_number || "+91 91234 56789"}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-60 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-20 w-36 h-36 bg-primary/8 rounded-full blur-3xl"></div>

      <div className="container px-4 py-4 sm:py-8 mx-auto max-w-6xl relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{
            y: isChatMode ? -100 : 0,
            opacity: isChatMode ? 0 : 1,
            height: isChatMode ? 0 : "auto",
            marginBottom: isChatMode ? 0 : 48,
          }}
          transition={{ duration: 0.5 }}
          className="text-center overflow-hidden"
        >
          <div className="mb-4 sm:mb-8">
            <motion.div
              className="inline-flex items-center px-4 py-2 mb-4 sm:mb-6 text-sm rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
              whileHover={{ scale: 1.05 }}
            >
              <Brain className="w-4 h-4 mr-2 text-primary" />
              <span className="text-primary font-medium">
                {t("document_query.header.service_name")}
              </span>
              <Zap className="w-4 h-4 ml-2 text-secondary" />
            </motion.div>
            <h1 className="mb-2 text-2xl font-bold tracking-wide sm:mb-4 sm:text-4xl lg:text-6xl">
              <span className="inline-block relative text-gray-900">
                LegalEase
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowA2AModal(true)}
                  className="flex absolute -top-1 -right-6 justify-center items-center w-5 h-5 bg-white rounded-full border-2 transition-all duration-200 cursor-help border-primary/50 hover:border-primary"
                >
                  <span className="text-xs font-bold text-primary">?</span>
                </motion.button>
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-secondary">
                {t("document_query.header.title_sub")}
              </span>
            </h1>

            {/* AI Model Toggle */}
            <div className="flex justify-center items-center mb-4">
              <motion.div
                className="flex items-center bg-white/60 backdrop-blur-sm rounded-full p-1 border border-white/40"
                whileHover={{ scale: 1.02 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUseASI(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    useASI
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  {t("document_query.header.asi_models")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUseASI(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    !useASI
                      ? "bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-lg"
                      : "text-gray-600 hover:text-secondary"
                  }`}
                >
                  {t("document_query.header.gemini_models")}
                </motion.button>
              </motion.div>
            </div>
            <p className="px-4 mx-auto max-w-2xl text-base leading-relaxed text-gray-600 sm:text-xl">
              {t("document_query.header.subtitle")}
            </p>
          </div>
        </motion.div>

        {/* A2A Protocol Modal */}
        <AnimatePresence>
          {showA2AModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex fixed inset-0 z-[9999] justify-center items-center p-4 backdrop-blur-sm bg-black/50"
              onClick={() => setShowA2AModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative p-6 w-full max-w-md bg-white rounded-2xl border shadow-2xl border-primary/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowA2AModal(false)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Modal Content */}
                <div className="pr-8">
                  <div className="flex items-center mb-4">
                    <div className="flex justify-center items-center mr-3 w-10 h-10 bg-gradient-to-br rounded-full from-primary/20 to-secondary/20">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t("document_query.modal.title")}
                    </h3>
                  </div>
                  <div className="space-y-3 text-gray-700">
                    <p className="leading-relaxed">
                      <strong>{t("document_query.modal.description")}</strong>
                    </p>
                    <div className="text-sm leading-relaxed text-gray-600">
                      {useASI ? (
                        <p>{t("document_query.modal.asi_benefit")}</p>
                      ) : (
                        <p>{t("document_query.modal.gemini_benefit")}</p>
                      )}
                    </div>
                    {useASI && (
                      <div className="p-3 bg-primary/10 rounded-lg text-xs">
                        <strong>
                          {t("document_query.modal.capabilities_title")}
                        </strong>
                        <br />• asi1-mini: 128K tokens, 85% accuracy
                        <br />• asi1-fast: 64K tokens, 87% accuracy
                        <br />• asi1-extended: 64K tokens, 89% accuracy
                        <br />• asi1-agentic: 64K tokens, 85% accuracy
                      </div>
                    )}
                  </div>

                  {/* Agent Icons */}
                  <div className="flex justify-center items-center p-4 mt-6 space-x-4 bg-gradient-to-r rounded-xl from-primary/10 to-secondary/10">
                    <div className="flex flex-col items-center">
                      <div className="flex justify-center items-center mb-2 w-12 h-12 bg-gradient-to-br rounded-full from-primary to-primary-dark">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {t("document_query.modal.roles.david")}
                      </span>
                      <span className="text-xs text-gray-600">
                        {t("document_query.modal.roles.david_desc")}
                      </span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400" />

                    <div className="flex flex-col items-center">
                      <div className="flex justify-center items-center mb-2 w-12 h-12 bg-gradient-to-br rounded-full from-secondary to-secondary-dark">
                        <MdPsychology className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-secondary">
                        {t("document_query.modal.roles.andrew")}
                      </span>
                      <span className="text-xs text-gray-600">
                        {t("document_query.modal.roles.andrew_desc")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl flex items-center"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Interface - Following Chatbot Pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            height: isChatMode ? "calc(100vh - 40px)" : "calc(100vh - 280px)",
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/50 shadow-2xl overflow-hidden flex flex-col"
          style={{ minHeight: "500px" }}
        >
          {/* Chat Messages Area */}
          <div className="flex flex-col h-full">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4"
              style={{ minHeight: 0 }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6">
                  <motion.div
                    className="flex justify-center items-center mx-auto mb-3 sm:mb-6 w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Brain className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                  </motion.div>
                  <h3 className="mb-2 sm:mb-3 text-lg sm:text-2xl font-bold text-gray-900">
                    {t("document_query.empty_state.title")}
                  </h3>
                  <p className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed text-gray-600 px-4">
                    {t("document_query.empty_state.description")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-primary rounded-lg shadow-md transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30"
                    >
                      <Paperclip className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      {t("document_query.empty_state.upload_btn")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsChatMode(true);
                        // optional: focus input
                        const input = document.querySelector(
                          'input[type="text"]',
                        ) as HTMLInputElement;
                        input?.focus();
                      }}
                      className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white rounded-lg shadow-md transition-colors bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                    >
                      <Sparkles className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      {t("document_query.empty_state.start_btn")}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{
                      opacity: 0,
                      x:
                        message.type === "user"
                          ? 50
                          : message.type === "system"
                            ? 0
                            : -50,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.type === "user"
                        ? "justify-end"
                        : message.type === "system"
                          ? "justify-center"
                          : "justify-start"
                    }`}
                  >
                    {message.type === "system" ? (
                      <div className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 rounded-lg border bg-primary/10 border-primary/20">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-6 shadow-lg ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-primary to-primary-dark text-white"
                            : "bg-gradient-to-r from-white/80 to-white/60 text-gray-800 border border-white/60"
                        }`}
                      >
                        <div className="text-sm sm:text-base leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Lawyer Cards */}
                        {message.lawyerCards &&
                          message.lawyerCards.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Recommended Lawyers:
                              </h4>
                              {message.lawyerCards.map((card, index) => (
                                <LawyerCardComponent key={index} card={card} />
                              ))}
                            </div>
                          )}

                        {/* Query Context */}
                        {message.queryContext && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600">
                              <strong>Legal Areas:</strong>{" "}
                              {message.queryContext.specializations?.join(
                                ", ",
                              ) || "General Legal"}
                              <br />
                              <strong>Confidence:</strong>{" "}
                              {message.queryContext.confidence}%
                            </div>
                          </div>
                        )}

                        <span
                          className={`text-xs mt-2 block ${
                            message.type === "user"
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming message */}
              {streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-6 shadow-lg bg-gradient-to-r from-white/80 to-white/60 text-gray-800 border border-white/60">
                    <div className="text-sm sm:text-base leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage.content}
                      </ReactMarkdown>
                    </div>
                    {isStreaming && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2"></div>
                        <span className="text-xs text-gray-500">
                          Streaming...
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {isProcessingMessage && !streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-6 shadow-lg bg-gradient-to-r from-white/80 to-white/60 border border-white/60">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {agentProgress ? agentProgress.message : "Thinking..."}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {agentProgress && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {agentProgress.stage === "david"
                              ? "Analyzing"
                              : agentProgress.stage === "andrew"
                                ? "Formatting"
                                : "Processing"}
                          </span>
                          <span>{agentProgress.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${agentProgress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* File Preview */}
            <AnimatePresence>
              {isFilePreviewOpen && fileInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 sm:p-6 border-t bg-gradient-to-r from-primary/10 to-secondary/10 border-white/30"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark">
                        <Paperclip className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-800">
                          {fileInfo.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-600 font-medium">
                          ({formatFileSize(fileInfo.size)})
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeFile}
                      className="p-1.5 sm:p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area - Mobile Optimized */}
            <div className="p-3 sm:p-6 border-t bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border-white/30">
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex items-center space-x-2 sm:space-x-3"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsChatMode(true)}
                    placeholder={t("document_query.chat.placeholder")}
                    disabled={isProcessingFile || isProcessingMessage}
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                  />

                  <label htmlFor="file-upload">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile || isProcessingMessage}
                      className={`p-2 sm:p-4 rounded-xl transition-all shadow-lg font-semibold ${
                        isProcessingFile || isProcessingMessage
                          ? "bg-gray-300 text-gray-500"
                          : "text-primary bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-xl"
                      }`}
                    >
                      <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </label>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={
                      !inputValue.trim() ||
                      isProcessingFile ||
                      isProcessingMessage
                    }
                    className={`p-2 sm:p-4 rounded-xl transition-all shadow-lg font-semibold ${
                      !inputValue.trim() ||
                      isProcessingFile ||
                      isProcessingMessage
                        ? "bg-gray-300 text-gray-500"
                        : "bg-gradient-to-r from-primary to-primary-dark hover:shadow-xl text-white"
                    }`}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DocumentQuery;
