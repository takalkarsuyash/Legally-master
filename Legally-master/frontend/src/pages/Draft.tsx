import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

import { INDIAN_LEGAL_REFERENCES } from '../ai/draftPrompt';
import { DraftService } from '../services/draftService';
import { DocumentType, FormInputs } from '../types/draft';
import { useAuth } from '../contexts/AuthContext';
import { DocumentService, UserDocument } from '../services/documentService';
import { useWallet } from '../contexts/WalletContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
] as const;

// Get placeholder text for document type
const getPlaceholderForDocumentType = (documentType: DocumentType | undefined): string => {
  switch (documentType) {
    case 'Rent Agreement':
      return 'Enter details such as property address, rent amount, lease term, security deposit...';
    case 'Employment Contract':
      return 'Enter details such as job title, salary, start date, working hours, benefits...';
    case 'Non-Disclosure Agreement':
      return 'Enter details such as confidential information definition, duration of agreement, permitted uses...';
    case 'Will':
      return 'Enter details such as beneficiaries, assets to be distributed, executor...';
    case 'Other':
    default:
      return 'Enter specific details relevant to this document type...';
  }
};

const LegalDocumentGenerator: React.FC = () => {
  // Main content states
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // UI states
  const [apiError, setApiError] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);
  const [useTemplateData, setUseTemplateData] = useState<boolean>(false);

  // Document states
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);

  // References
  const contentRef = useRef<HTMLDivElement>(null);
  const accumulatedContentRef = useRef<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<FormInputs>({
    defaultValues: {
      documentType: undefined,
      partyA: '',
      partyB: '',
      additionalDetails: '',
      specificDetails: '',
      state: ''
    }
  });

  const selectedDocumentType = watch('documentType');

  // Template data for quick demo
  const templateData: FormInputs = {
    documentType: 'Rent Agreement',
    partyA: 'Rajesh Kumar',
    partyB: 'Priya Sharma',
    additionalDetails: '3 BHK Flat in Pune with building amenities in-house like swimming pool, gym etc. Agreement is done in Pune with witnesses Arjun Singh and Kavya Patel.',
    specificDetails: 'Rent agreement is of 3 months duration where the rent is to be paid prior. Monthly rent: ₹15,000 with ₹2,000 maintenance per month. Agreement date: 5th April 2025. Property includes all modern amenities and facilities.',
    state: 'Maharashtra'
  };

  // Handle template data toggle
  const handleTemplateDataToggle = useCallback((checked: boolean) => {
    setUseTemplateData(checked);
    if (checked) {
      Object.entries(templateData).forEach(([key, value]) => {
        setValue(key as keyof FormInputs, value);
      });
    } else {
      reset({
        documentType: undefined,
        partyA: '', partyB: '',
        additionalDetails: '', specificDetails: '',
        state: ''
      });
    }
  }, [setValue, reset, templateData]);

  // Services
  const { user } = useAuth();
  const { spendTokens } = useWallet();
  const documentService = DocumentService.getInstance();

  // Auto-scroll to bottom when streaming content updates
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [generatedContent, isStreaming]);


  // Handle streaming chunks from API
  const handleStreamChunk = useCallback(async (chunk: string, done: boolean) => {
    accumulatedContentRef.current += chunk;
    
    if (done) {
      // Clean the final content to remove ASI footers/disclaimers
      const footerPatterns = [
        /ASI:One is not a law firm[\s\S]*?do not assume liability for implementation\./i,
        /Prepared in compliance with[\s\S]*?Document ID: [^\n]*/i,
        /Verified by ASI:One[\s\S]*?Agentverse\.ai Agentic Workflow[^\n]*/i,
        /Fetch\.ai Inc\. and ASI:One[\s\S]*?do not assume liability[^\n]*/i
      ];
      
      let cleanedContent = accumulatedContentRef.current;
      for (const pattern of footerPatterns) {
        cleanedContent = cleanedContent.replace(pattern, '').trim();
      }
      cleanedContent = cleanedContent.replace(/\s+$/, '');
      
      accumulatedContentRef.current = cleanedContent;
      setGeneratedContent(cleanedContent);
      
      setIsStreaming(false);
      setIsGenerating(false);
      if (user?.id && cleanedContent.trim()) {
        try {
          const title = `${selectedDocumentType || 'Legal Document'} - ${new Date().toLocaleDateString()}`;
          await documentService.saveDocument(
            user.id,
            title,
            cleanedContent,
            selectedDocumentType
          );
          const docs = await documentService.getUserDocuments(user.id);
          setUserDocs(docs);
        } catch (error) {
          console.error("Error saving document:", error);
          toast.error("Could not save the document to your history.");
        }
      }
    } else {
      setGeneratedContent(accumulatedContentRef.current);
    }
  }, [user?.id, selectedDocumentType, documentService]);

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = useCallback(async (data) => {
    setApiError(null);
    setIsGenerating(true);
    setGeneratedContent('');
    accumulatedContentRef.current = '';

    try {
      // Deduct tokens for legal draft
      const tokenResult = await spendTokens('legal_draft');
      if (!tokenResult.success) {
        setApiError(tokenResult.message || 'Failed to process payment');
        setIsGenerating(false);
        return;
      }

      if (useStreaming) {
        setIsStreaming(true);
        await DraftService.streamDocument(data, handleStreamChunk);
      } else {
        let document = await DraftService.generateDocument(data);
        
        // Clean the document to remove ASI footers/disclaimers
        const footerPatterns = [
          /ASI:One is not a law firm[\s\S]*?do not assume liability for implementation\./i,
          /Prepared in compliance with[\s\S]*?Document ID: [^\n]*/i,
          /Verified by ASI:One[\s\S]*?Agentverse\.ai Agentic Workflow[^\n]*/i,
          /Fetch\.ai Inc\. and ASI:One[\s\S]*?do not assume liability[^\n]*/i
        ];
        
        for (const pattern of footerPatterns) {
          document = document.replace(pattern, '').trim();
        }
        document = document.replace(/\s+$/, '');
        
        setGeneratedContent(document);
        setIsGenerating(false);

        if (user?.id && document.trim()) {
          try {
            const title = `${data.documentType || 'Legal Document'} - ${new Date().toLocaleDateString()}`;
            await documentService.saveDocument(user.id, title, document, data.documentType);
            const docs = await documentService.getUserDocuments(user.id);
            setUserDocs(docs);
          } catch (error) {
            console.error("Error saving document:", error);
            toast.error("Could not save the document to your history.");
          }
        }
      }
    } catch (error) {
      console.error("Document generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while generating the document.";
      setApiError(errorMessage);
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }, [handleStreamChunk, useStreaming, user?.id, documentService]);





  // Load user docs on mount
  useEffect(() => {
    const loadUserDocs = async () => {
      if (user?.id) {
        try {
          const docs = await documentService.getUserDocuments(user.id);
          setUserDocs(docs);
        } catch (error) {
          console.error("Error loading user docs:", error);
        }
      }
    };
    loadUserDocs();
  }, [user?.id, documentService]);

  const hasContent = !!generatedContent;
  const isLoading = isGenerating && !isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden relative min-h-screen bg-gradient-to-br from-background via-background to-primary/10"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 bg-ambient-pattern"></div>
      <div className="absolute left-10 top-20 w-32 h-32 rounded-full blur-3xl bg-primary/5"></div>
      <div className="absolute right-20 top-60 w-40 h-40 rounded-full blur-3xl bg-secondary/10"></div>
      <div className="absolute left-20 bottom-40 w-36 h-36 rounded-full blur-3xl bg-primary/8"></div>

      <div className="container relative z-10 px-4 py-4 mx-auto max-w-7xl sm:py-8">
        {/* Header Section */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 text-center sm:mb-12"
        >
          <div className="mb-4 sm:mb-8">
            <motion.div
              className="inline-flex items-center px-4 py-2 mb-4 text-sm rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30"
              whileHover={{ scale: 1.05 }}
            >
              <FileText className="mr-2 w-4 h-4 text-primary" />
              <span className="font-medium text-primary">AI-Powered Legal Drafting</span>
            </motion.div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:mb-4 sm:text-5xl lg:text-6xl">
              <span className="text-gray-900">Legal Document</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-secondary">
                Generator
              </span>
            </h1>
            <p className="px-4 mx-auto max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Create professional legal documents with AI assistance, tailored for Indian law.
            </p>
          </div>

          {/* Control Toggles */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <motion.label
              className="flex items-center px-5 py-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 shadow-lg transition-all cursor-pointer hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
            >
              <span className="mr-3 text-sm font-medium text-gray-700">Streaming Mode</span>
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
              />
            </motion.label>
            <motion.label
              className="flex items-center px-5 py-2.5 rounded-xl bg-green-50/70 backdrop-blur-md border border-green-200/60 shadow-lg transition-all cursor-pointer hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
            >
              <span className="mr-3 text-sm font-medium text-green-800">Use Template Data</span>
              <input
                type="checkbox"
                checked={useTemplateData}
                onChange={(e) => handleTemplateDataToggle(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 focus:ring-2"
              />
            </motion.label>
          </div>
        </motion.header>

        <main className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Left Panel - Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="p-6 bg-white/60 rounded-3xl border border-white/50 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <h2 className="flex items-center mb-6 space-x-3 text-xl font-bold text-gray-900 sm:text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark">
                <FileText className="w-5 h-5 text-white sm:w-6 sm:h-6" />
              </div>
              <span>Document Details</span>
            </h2>

            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {/* Form Fields */}
              <div>
                <label htmlFor="documentType" className="block mb-1.5 text-sm font-bold text-gray-800">Document Type</label>
                <select
                  id="documentType"
                  {...register("documentType", { required: "Document type is required" })}
                  className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition"
                >
                  <option value="">Select Document Type</option>
                  {Object.keys(INDIAN_LEGAL_REFERENCES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}

                </select>
                {errors.documentType && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.documentType.message}</p>}
              </div>

              <div>
                <label htmlFor="partyA" className="block mb-1.5 text-sm font-bold text-gray-800">Party A (First Party)</label>
                <input
                  type="text"
                  id="partyA"
                  {...register("partyA", { required: "Party A is required" })}
                  className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition"
                />
                {errors.partyA && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.partyA.message}</p>}
              </div>

              <div>
                <label htmlFor="partyB" className="block mb-1.5 text-sm font-bold text-gray-800">Party B (Second Party)</label>
                <input
                  type="text"
                  id="partyB"
                  {...register("partyB", { required: "Party B is required" })}
                  className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition"
                />
                {errors.partyB && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.partyB.message}</p>}
              </div>

              <div>
                <label htmlFor="additionalDetails" className="block mb-1.5 text-sm font-bold text-gray-800">Additional Details</label>
                <textarea
                  id="additionalDetails"
                  {...register("additionalDetails", { required: "Additional details are required" })}
                  placeholder="Enter any additional terms, conditions, or context..."
                  className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark min-h-[100px] transition resize-none"
                />
                {errors.additionalDetails && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.additionalDetails.message}</p>}
              </div>

              <div>
                <label htmlFor="specificDetails" className="block mb-1.5 text-sm font-bold text-gray-800">
                  {selectedDocumentType ? `Specific Details for ${selectedDocumentType}` : 'Specific Details'}
                </label>
                <textarea
                  id="specificDetails"
                  {...register("specificDetails", { required: "Specific details are required" })}
                  placeholder={getPlaceholderForDocumentType(selectedDocumentType as DocumentType)}
                  className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark min-h-[100px] transition resize-none"
                />
                {errors.specificDetails && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.specificDetails.message}</p>}
              </div>

              {selectedDocumentType && selectedDocumentType !== 'Other' && (
                <div>
                  <label htmlFor="state" className="block mb-1.5 text-sm font-bold text-gray-800">State/UT of Jurisdiction</label>
                  <select
                    id="state"
                    {...register("state")}
                    className="block w-full px-4 py-2.5 text-base bg-white/70 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition"
                  >
                    <option value="">Select State/UT</option>
                    {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex justify-center items-center w-full px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isGenerating}
              >
                {isGenerating ? <Loader className="mr-3 w-5 h-5 animate-spin" /> : <FileText className="mr-3 w-5 h-5" />}
                {isGenerating ? (isStreaming ? 'Generating...' : 'Processing...') : 'Generate Document'}
              </motion.button>
            </form>

            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center p-4 mt-6 space-x-4 bg-red-100/80 rounded-2xl border border-red-200 shadow-md"
                >
                  <div className="p-2 rounded-full bg-red-500"><AlertCircle className="w-5 h-5 text-white" /></div>
                  <span className="flex-1 text-sm font-medium text-red-800">{apiError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel - Document Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col p-6 bg-white/60 rounded-3xl border border-white/50 shadow-2xl backdrop-blur-xl sm:p-8 h-[600px]"
          >
            <h2 className="flex items-center mb-6 space-x-3 text-xl font-bold text-gray-900 sm:text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-secondary to-primary">
                <FileText className="w-5 h-5 text-white sm:w-6 sm:h-6" />
              </div>
              <span>Generated Document</span>
            </h2>

            <div className="flex flex-col flex-1 min-h-0">
              {isLoading ? (
                <div className="flex-1 p-6 space-y-4 bg-gray-50/70 rounded-2xl border border-gray-200/80 shadow-inner animate-pulse">
                  <div className="w-3/4 h-5 rounded bg-gray-200"></div>
                  <div className="w-full h-4 rounded bg-gray-200"></div>
                  <div className="w-5/6 h-4 rounded bg-gray-200"></div>
                  <div className="w-full h-4 rounded bg-gray-200"></div>
                </div>
              ) : (hasContent || isStreaming) ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col flex-1 space-y-4 min-h-0"
                >
                  <div
                    ref={contentRef}
                    className="overflow-y-auto flex-1 p-5 bg-white/80 rounded-2xl border shadow-inner backdrop-blur-sm sm:p-6"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                      lineHeight: 1.6,
                      height: 'calc(600px - 180px)', // Account for header and button
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0,0,0,0.2) rgba(0,0,0,0.05)'
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({ ...props }) => <h1 className="mb-4 text-xl font-bold text-center text-gray-900" {...props} />,
                        h2: ({ ...props }) => <h2 className="my-3 text-lg font-semibold text-gray-800" {...props} />,
                        p: ({ ...props }) => <p className="mb-3 text-base text-justify text-gray-800" {...props} />,
                      }}
                    >
                      {generatedContent}
                    </ReactMarkdown>
                    {isStreaming && <span className="inline-block ml-1 w-2 h-5 rounded-sm animate-pulse bg-primary" />}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col flex-1 justify-center items-center p-6 text-center bg-gray-50/70 rounded-2xl border border-gray-200/80 shadow-inner">
                  <motion.div
                    className="flex justify-center items-center w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-5"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FileText className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900">Ready to Generate</h3>
                  <p className="mt-2 text-base text-gray-600">Fill out the form and your document will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* Document History Section */}
        {user && userDocs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 sm:mt-16"
          >
            <h2 className="mb-8 text-2xl font-bold text-center text-gray-900">Your Document History</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-white/60 rounded-2xl border border-white/50 shadow-lg backdrop-blur-lg"
                >
                  <div className="flex-1 min-w-0 mb-4">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{doc.title}</h3>
                    <p className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setGeneratedContent(doc.content);
                        // Optional: Scroll to top for better UX
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        toast.success("Document loaded into preview.");
                      }}
                      className="flex-1 flex justify-center items-center px-4 py-2 space-x-2 text-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow hover:shadow-md transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View / Edit</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        if (window.confirm("Are you sure? This will delete the document from your history.")) {
                          try {
                            await documentService.deleteDocument(user.id, doc.id);
                            setUserDocs(prev => prev.filter(d => d.id !== doc.id));
                            toast.success("Document deleted.");
                          } catch (error) {
                            console.error("Error deleting document:", error);
                            toast.error("Failed to delete document.");
                          }
                        }
                      }}
                      className="p-2.5 text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow hover:shadow-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(LegalDocumentGenerator);