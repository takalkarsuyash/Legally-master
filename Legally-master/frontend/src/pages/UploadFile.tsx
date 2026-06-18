import { useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useHash } from "../contexts/HashContext";

const API_URL = import.meta.env.VITE_SERVER_URL || '';

const UploadFile = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const { hashData, setHashData } = useHash();
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("Hash ID: ", hashData.hashId);

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (file.size > maxSize) {
      return t('upload_file.error.size');
    }

    if (!allowedTypes.includes(file.type)) {
      return t('upload_file.error.type');
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setUploadStatus(error);
      return;
    }

    setFile(selectedFile);
    setUploadStatus("");
    setHashData({ hashId: "" });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setUploadStatus(t('upload_file.success.copied'));
      setTimeout(() => setUploadStatus(t('upload_file.success.uploaded')), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setHashData({ hashId: "" });
    setUploadStatus("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`${t('upload_file.error.http')} ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Extract CID from lighthouse response
      const extractedCID =
        data.lighthouseResponse?.Hash || data.cid || t('upload_file.error.no_cid');
      console.log("Extracted CID:", extractedCID);
      setHashData({ hashId: extractedCID });

      setUploadStatus(t('upload_file.success.uploaded'));
    } catch (error) {
      console.error("Upload error:", error);
      setProgress(0);
      setUploadStatus(
        error instanceof Error
          ? error.message
          : t('upload_file.error.generic')
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto w-2xl">
        {/* Main Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="space-y-6">
            {/* File Input with Drag & Drop */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50 scale-105"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="text-center">
                  {file ? (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-green-500 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </>
                  ) : isDragOver ? (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-blue-500 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9"
                        ></path>
                      </svg>
                      <p className="text-sm font-medium text-blue-600">
                        {t('upload_file.drop_zone.drop')}
                      </p>
                    </>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-3"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {t('upload_file.drop_zone.click')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('upload_file.drop_zone.formats')}
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* File Actions */}
            {file && !isUploading && !hashData.hashId && (
              <div className="flex gap-3">
                <button
                  onClick={resetUpload}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('upload_file.actions.remove')}
                </button>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('upload_file.actions.uploading')}</span>
                  <span className="text-gray-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('upload_file.actions.uploading')}
                </div>
              ) : (
                t('upload_file.actions.upload')
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm ${
              uploadStatus.includes("successfully")
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {uploadStatus}
          </div>
        )}

        {/* Success Card with CID */}
        {hashData.hashId && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('upload_file.success.title')}
              </h3>
              <p className="text-gray-600">
                {t('upload_file.success.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('upload_file.success.cid_label')}
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                    {hashData.hashId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(hashData.hashId)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md transition-all"
                    title="Copy CID"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`https://gateway.lighthouse.storage/ipfs/${hashData.hashId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-500 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('upload_file.actions.view')}
                </a>
                <button
                  onClick={resetUpload}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('upload_file.actions.another')}
                </button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  {t('upload_file.footer.decentralized')}
                </p>
                <p>{t('upload_file.footer.share')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFile;
