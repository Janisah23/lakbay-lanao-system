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
    if (!confirm(`Delete "${name}" from the knowledge base?`)) return;

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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] rounded-2xl">
      <div className="max-w-7xl mx-auto pt-6 pb-20 px-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">
            AI Knowledge Base
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload documents to give the chatbot context about Lanao del Sur. Supported: PDF, TXT, DOCX.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-[20px] text-sm font-medium shadow-sm border ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheckCircle className="text-green-600 text-base shrink-0" />
            ) : (
              <FiAlertCircle className="text-red-600 text-base shrink-0" />
            )}
            {toast.msg}
          </div>
        )}

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && !fileToConfirm && fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-[28px] px-8 py-14 transition-all duration-200 ${
            !uploading && !fileToConfirm ? "cursor-pointer" : ""
          } ${
            dragOver
              ? "border-[#2563EB] bg-blue-50"
              : "border-gray-200 bg-white hover:border-[#2563EB] hover:bg-blue-50/40"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.docx"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />

          {uploading ? (
            <>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FiRefreshCw className="text-[#2563EB] text-2xl animate-spin" />
              </div>
              <p className="text-sm font-medium text-[#2563EB]">
                Processing & embedding document…
              </p>
              <p className="text-xs text-gray-400">
                This may take a few minutes for larger files
              </p>
            </>
          ) : fileToConfirm ? (
            <div className="text-center z-10 w-full max-w-md bg-white border border-blue-100 shadow-sm p-6 rounded-[28px] animate-fadeIn">
              <FiFileText className="text-4xl text-[#2563EB] mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Upload Confirmation
              </p>
              <p className="text-xs text-gray-500 mb-6 truncate px-4">
                Are you sure you want to process{" "}
                <strong className="text-gray-800">{fileToConfirm.name}</strong>?
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileToConfirm(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded-full bg-gray-100 px-5 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmUpload();
                  }}
                  className="rounded-full bg-[#2563eb] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  Process File
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FiUploadCloud className="text-[#2563EB] text-2xl" />
              </div>
              <div className="text-center pointer-events-none">
                <p className="text-sm font-medium text-gray-800">
                  Drag & drop a file here, or{" "}
                  <span className="text-[#2563EB] underline">click to browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, TXT, DOCX — max 100 MB</p>
              </div>
            </>
          )}
        </div>

        {/* Documents list */}
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">
              Uploaded Documents
              {!loadingDocs && (
                <span className="ml-2 text-xs bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded-full font-semibold">
                  {documents.length}
                </span>
              )}
            </p>

            <button
              onClick={fetchDocuments}
              disabled={loadingDocs}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#2563EB] transition disabled:opacity-50"
            >
              <FiRefreshCw className={loadingDocs ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loadingDocs ? (
            <div className="flex justify-center py-12">
              <FiRefreshCw className="text-2xl text-[#2563EB] animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
              <FiFileText className="text-4xl" />
              <p className="text-sm">No documents in the knowledge base yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <li
                  key={doc.name}
                  className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FiFileText className="text-[#2563EB]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        <span className="text-[#2563EB] font-semibold">
                          {doc.chunkCount}
                        </span>{" "}
                        chunk{doc.chunkCount !== 1 ? "s" : ""}
                        {doc.uploadedAt && (
                          <>
                            {" "}
                            ·{" "}
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
                    className="ml-4 shrink-0 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full px-4 py-2 transition disabled:opacity-50"
                  >
                    {deletingName === doc.name ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiTrash2 />
                    )}
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIKnowledge;