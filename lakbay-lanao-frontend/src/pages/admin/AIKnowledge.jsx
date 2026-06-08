import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiUploadCloud,
  FiTrash2,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";

const API = "https://lakbay-lanao-backend.onrender.com/api/knowledge";

function AIKnowledge() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null); // Added state for the custom delete modal
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileToConfirm, setFileToConfirm] = useState(null);
  const fileRef = useRef(null);

  // REDESIGNED: Toast now accepts a title for better context
  const showToast = (type, title, msg) => {
    setToast({ type, title, msg });
    setTimeout(() => setToast(null), 5000); // Increased to 5s so users have time to read
  };

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);

    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      // HUMAN-READABLE ERROR
      showToast(
        "error",
        "Connection Error",
        "We're having trouble loading your documents right now. Please check your internet connection and try refreshing."
      );
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = (file) => {
    if (!file) return;

    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.type)) {
      // HUMAN-READABLE ERROR
      return showToast(
        "error",
        "Unsupported File Type",
        "Oops! We only accept PDF, TXT, and DOCX files. Please choose a different file format."
      );
    }

    setFileToConfirm(file);
  };

  const confirmUpload = async () => {
    if (!fileToConfirm) return;

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", fileToConfirm);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      showToast(
        "success",
        "Upload Complete",
        "Your document has been successfully processed and added to the chatbot's knowledge base."
      );
      fetchDocuments();
    } catch (err) {
      console.error(err);
      // HUMAN-READABLE ERROR
      showToast(
        "error",
        "Upload Failed",
        "We couldn't process your document. The file might be corrupted, too large, or our servers are busy. Please try again."
      );
    } finally {
      setUploading(false);
      setFileToConfirm(null);

      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // REDESIGNED: Execute the deletion after the custom modal confirms it
  const executeDelete = async () => {
    if (!documentToDelete) return;
    
    const name = documentToDelete;
    setDocumentToDelete(null); // Close modal immediately
    setDeletingName(name); // Show loading spinner on the specific item

    try {
      const res = await fetch(`${API}/documents/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Delete failed");

      showToast(
        "success",
        "Document Removed",
        "The file was successfully deleted and is no longer used by the chatbot."
      );
      setDocuments((prev) => prev.filter((d) => d.name !== name));
    } catch (err) {
      console.error(err);
      // HUMAN-READABLE ERROR
      showToast(
        "error",
        "Deletion Failed",
        "We ran into a snag while trying to remove this document. Please wait a moment and try again."
      );
    } finally {
      setDeletingName(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];

    if (file) handleFileSelect(file);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      
      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md scale-100 transform overflow-hidden rounded-[28px] border border-gray-100 bg-white p-7 shadow-2xl transition-all">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiTrash2 className="text-3xl" />
            </div>
            
            <h3 className="text-center text-xl font-bold text-gray-900">
              Delete Document
            </h3>
            
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
              Are you sure you want to permanently remove <span className="font-semibold text-gray-800">"{documentToDelete}"</span>? The AI will no longer use this file as a reference.
            </p>
            
            <div className="mt-7 flex justify-center gap-3">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-600"
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
            Chatbot Content
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
            AI Knowledge Base
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
            Upload documents to give the chatbot reliable context about Lanao
            del Sur. Supported formats: PDF, TXT, and DOCX.
          </p>
        </section>

        {/* REDESIGNED TOAST NOTIFICATION */}
        {toast && (
          <div
            className={`mb-6 overflow-hidden rounded-[20px] border shadow-sm transition-all duration-300 ${
              toast.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-4 p-5">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  toast.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {toast.type === "success" ? (
                  <FiCheckCircle className="text-xl" />
                ) : (
                  <FiAlertCircle className="text-xl" />
                )}
              </div>

              <div className="flex-1">
                <h3
                  className={`text-sm font-bold ${
                    toast.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {toast.title}
                </h3>
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    toast.type === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {toast.msg}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className={`shrink-0 rounded-full p-1.5 transition ${
                  toast.type === "success"
                    ? "text-green-500 hover:bg-green-100"
                    : "text-red-500 hover:bg-red-100"
                }`}
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>
        )}

        {/* UPLOAD ZONE */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() =>
            !uploading && !fileToConfirm && fileRef.current?.click()
          }
          className={`relative mb-8 flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-8 py-14 text-center transition duration-300 ${
            !uploading && !fileToConfirm ? "cursor-pointer" : ""
          } ${
            dragOver
              ? "border-[#2563eb] bg-blue-50"
              : "border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] hover:border-[#2563eb]/50 hover:bg-blue-50/40"
          } ${uploading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                <FiRefreshCw className="animate-spin text-3xl" />
              </div>

              <p className="text-lg font-bold text-[#2563eb]">
                Processing document...
              </p>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Please wait while the system prepares and embeds the document
                for chatbot use.
              </p>
            </div>
          ) : fileToConfirm ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_10px_28px_rgba(37,99,235,0.08)]"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                <FiFileText className="text-3xl" />
              </div>

              <h2 className="text-xl font-bold text-[#2563eb]">
                Confirm Upload
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Are you sure you want to process this file?
              </p>

              <p className="mt-3 truncate rounded-[16px] border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-gray-700">
                {fileToConfirm.name}
              </p>

              <div className="mt-7 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFileToConfirm(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded-full border border-[#2563eb]/20 bg-white px-6 py-2.5 text-sm font-medium text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmUpload}
                  className="rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Process File
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                <FiUploadCloud className="text-3xl" />
              </div>

              <h2 className="text-xl font-bold text-[#2563eb]">
                Upload Knowledge Document
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-500">
                Drag and drop a file here, or click to browse from your device.
                The uploaded document will be used as chatbot reference.
              </p>

              <span className="mt-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                PDF · TXT · DOCX only
              </span>
            </div>
          )}
        </section>

        {/* DOCUMENTS PANEL */}
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="flex flex-col justify-between gap-4 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-3 text-lg font-bold text-[#2563eb]">
                Active Documents
                {!loadingDocs && (
                  <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                    {documents.length}
                  </span>
                )}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage uploaded files used by the chatbot knowledge base.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDocuments}
              disabled={loadingDocs}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#2563eb] shadow-sm transition hover:bg-blue-50 disabled:opacity-50"
            >
              <FiRefreshCw
                className={loadingDocs ? "animate-spin text-[#2563eb]" : ""}
              />
              Refresh
            </button>
          </div>

          {loadingDocs ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FiRefreshCw className="mb-3 animate-spin text-3xl text-[#2563eb]" />
              <p className="text-sm font-medium text-gray-500">
                Syncing knowledge base...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                <FiFileText className="text-3xl" />
              </div>

              <p className="text-base font-bold text-gray-800">
                No documents found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Upload your first document to give the AI chatbot context.
              </p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <ul className="divide-y divide-blue-50">
                {documents.map((doc) => (
                  <li
                    key={doc.name}
                    className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-blue-50/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px] border border-blue-100 bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                        <FiFileText className="text-xl" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-gray-800 transition group-hover:text-[#2563eb]">
                          {doc.name}
                        </p>

                        <p className="mt-0.5 text-sm text-gray-500">
                          <span className="font-bold text-[#2563eb]">
                            {doc.chunkCount}
                          </span>{" "}
                          chunk{doc.chunkCount !== 1 ? "s" : ""}
                          {doc.uploadedAt && (
                            <>
                              <span className="mx-1.5 text-gray-300">•</span>
                              {new Date(doc.uploadedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      // Trigger the custom modal instead of window.confirm
                      onClick={() => setDocumentToDelete(doc.name)}
                      disabled={deletingName === doc.name}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-5 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      {deletingName === doc.name ? (
                        <FiRefreshCw className="animate-spin text-lg" />
                      ) : (
                        <FiTrash2 className="text-lg" />
                      )}
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AIKnowledge;