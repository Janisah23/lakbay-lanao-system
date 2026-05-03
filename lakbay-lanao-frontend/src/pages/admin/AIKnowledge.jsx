import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiUploadCloud,
  FiTrash2,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const API = "http://localhost:5000/api/knowledge";

function AIKnowledge() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileToConfirm, setFileToConfirm] = useState(null);
  const fileRef = useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDocuments(data.documents || []);
    } catch (err) {
      showToast("error", "Failed to load documents: " + err.message);
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
      return showToast("error", "Only PDF, TXT, and DOCX files are supported.");
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

      showToast("success", data.message);
      fetchDocuments();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setUploading(false);
      setFileToConfirm(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete "${name}" from the knowledge base?`)) return;

    setDeletingName(name);
    try {
      const res = await fetch(`${API}/documents/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      showToast("success", data.message);
      setDocuments((prev) => prev.filter((d) => d.name !== name));
    } catch (err) {
      showToast("error", err.message);
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
      <div className="w-full">
      <div className="max-w-7xl mx-auto pt-6 pb-20 px-6 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
            AI Knowledge Base
          </h1>
          <p className="text-gray-500 mt-2">
            Upload documents to give the chatbot context about Lanao del Sur. Supported formats: PDF, TXT, DOCX.
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-[12px] text-sm font-medium shadow-sm border animate-fadeIn ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheckCircle className="text-green-600 text-lg shrink-0" />
            ) : (
              <FiAlertCircle className="text-red-600 text-lg shrink-0" />
            )}
            {toast.msg}
          </div>
        )}

        {/* Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && !fileToConfirm && fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[28px] px-8 py-16 transition-all duration-300 ${
            !uploading && !fileToConfirm ? "cursor-pointer" : ""
          } ${
            dragOver
              ? "border-[#2563eb] bg-blue-50 scale-[1.01]"
              : "border-gray-200 bg-white hover:border-[#2563eb] hover:bg-blue-50/40 shadow-sm hover:shadow-md"
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
            <div className="flex flex-col items-center text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 shadow-sm">
                <FiRefreshCw className="text-[#2563eb] text-2xl animate-spin" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-1">
                Processing & embedding document...
              </p>
              <p className="text-sm text-gray-500">
                Please wait. This may take a few minutes for larger files.
              </p>
            </div>
          ) : fileToConfirm ? (
            <div className="text-center z-10 w-full max-w-md bg-white border border-gray-200 shadow-md p-8 rounded-[24px] animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                <FiFileText className="text-3xl text-[#2563eb]" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-2">
                Confirm Upload
              </p>
              <p className="text-sm text-gray-500 mb-8 truncate px-2">
                Are you sure you want to process <br/>
                <strong className="text-gray-900 font-semibold">{fileToConfirm.name}</strong>?
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileToConfirm(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmUpload();
                  }}
                  className="rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                >
                  Process File
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 shadow-sm">
                <FiUploadCloud className="text-[#2563eb] text-3xl" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-1">
                Drag & drop a file here, or{" "}
                <span className="text-[#2563eb] underline pointer-events-auto cursor-pointer">click to browse</span>
              </p>
              <p className="text-sm text-gray-500">PDF, TXT, DOCX files only (max 100 MB)</p>
            </div>
          )}
        </div>

        {/* Documents List Panel */}
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden flex flex-col transition duration-300 hover:shadow-md">
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              Active Documents
              {!loadingDocs && (
                <span className="ml-3 text-xs bg-blue-100 text-[#2563eb] px-2.5 py-1 rounded-full font-bold shadow-sm">
                  {documents.length}
                </span>
              )}
            </h3>

            <button
              onClick={fetchDocuments}
              disabled={loadingDocs}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#2563eb] transition disabled:opacity-50 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:bg-blue-50"
            >
              <FiRefreshCw className={loadingDocs ? "animate-spin text-[#2563eb]" : ""} />
              Refresh
            </button>
          </div>

          {loadingDocs ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FiRefreshCw className="text-3xl text-[#2563eb] animate-spin mb-3" />
              <p className="text-sm text-gray-500 font-medium">Syncing knowledge base...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <FiFileText className="text-3xl text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-700 mb-1">No documents found</p>
              <p className="text-sm text-gray-500">Upload your first document to give the AI context.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <ul className="divide-y divide-gray-50">
                {documents.map((doc) => (
                  <li
                    key={doc.name}
                    className="flex items-center justify-between px-8 py-5 hover:bg-blue-50/40 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-[14px] bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#2563eb] group-hover:text-white transition-colors text-[#2563eb]">
                        <FiFileText className="text-xl" />
                      </div>

                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="text-base font-bold text-gray-900 truncate group-hover:text-[#2563eb] transition-colors">
                          {doc.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          <span className="text-[#2563eb] font-bold">
                            {doc.chunkCount}
                          </span>{" "}
                          chunk{doc.chunkCount !== 1 ? "s" : ""}
                          {doc.uploadedAt && (
                            <>
                              {" "}
                              <span className="mx-1.5 text-gray-300">•</span>{" "}
                              {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.name)}
                      disabled={deletingName === doc.name}
                      className="ml-4 shrink-0 flex items-center gap-2 text-sm font-medium text-red-500 bg-white border border-red-100 hover:text-white hover:bg-red-500 hover:border-red-500 rounded-full px-5 py-2 shadow-sm transition-all disabled:opacity-50"
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
        </div>

      </div>
    </div>
  );
}

export default AIKnowledge;