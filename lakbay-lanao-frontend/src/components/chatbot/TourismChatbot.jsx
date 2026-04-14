import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { FiTrash2 } from "react-icons/fi";

const DEFAULT_MESSAGES = [
  {
    sender: "bot",
    text: "Welcome to Lakbay Lanao Assistant! I can help you explore destinations, events, hotels, and travel tips in Lanao del Sur.",
  },
  {
    sender: "suggestions",
    options: [
      "What is Lakbay Lanao?",
      "Top tourist destinations in Lanao del Sur",
      "Where can I find hotels in Marawi?",
      "What events are happening this month?",
    ],
  },
];

function TourismChatbot() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const chatRef = useRef(null);
  const buttonRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  const [messages, setMessages] = useState(DEFAULT_MESSAGES);

  // Sync to firestore whenever messages change
  useEffect(() => {
    if (!user) return;
    // Skip saving if it's purely default
    if (messages === DEFAULT_MESSAGES || (messages.length === 2 && messages[0].text.includes("Welcome"))) return;

    setDoc(doc(db, "userChats", user.uid), { messages }).catch(console.error);
  }, [messages, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "userChats", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().messages) {
            setMessages(docSnap.data().messages);
            setSuggestionsVisible(false); // Hide suggestions if history exists
          } else {
            setMessages(DEFAULT_MESSAGES);
            setSuggestionsVisible(true);
          }
        } catch (err) {
          console.error("Failed to recover chat:", err);
        }
      } else {
        setMessages(DEFAULT_MESSAGES);
        setSuggestionsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (manuallyOpen) {
      setManuallyOpen(false);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!open) return;

      const clickedInsideChat =
        chatRef.current && chatRef.current.contains(event.target);
      const clickedButton =
        buttonRef.current && buttonRef.current.contains(event.target);

      if (!clickedInsideChat && !clickedButton) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, typing]);

  const clearChatHistory = async () => {
    setMessages(DEFAULT_MESSAGES);
    setSuggestionsVisible(true);
    if (user) {
      try {
        await deleteDoc(doc(db, "userChats", user.uid));
      } catch (err) {
        console.error("Failed to delete chat history:", err);
      }
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSuggestionsVisible(false);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      const botReply = {
        sender: "bot",
        text: data.reply || data.error || "Sorry, I couldn't get a response.",
      };

      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Could not reach the server. Please make sure the backend is running.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <div className="fixed bottom-6 right-6 z-[9999] group">
        <button
          ref={buttonRef}
          onClick={() => {
            if (!user) {
              navigate("/login");
              return;
            }
            setOpen((prev) => !prev);
          }}
          className="
            relative rounded-full p-1.5
           
            shadow-[0_12px_28px_rgba(37,99,235,0.18)]
            backdrop-blur-sm
            transition-all duration-300
            hover:scale-105 hover:shadow-[0_14px_32px_rgba(37,99,235,0.22)]
          "
        >
          <img
            src="/chatbot-icon.png"
            alt="Chatbot"
            className="h-16 w-16 rounded-full object-cover md:h-[72px] md:w-[72px]"
          />
        </button>

        {!user && (
          <div
            className="
              absolute bottom-24 left-1/2 -translate-x-1/2
              whitespace-nowrap rounded-xl
              bg-gray-900/90 px-3 py-1.5 text-xs text-white
              opacity-0 shadow-lg
              translate-y-2 transition duration-200
              group-hover:translate-y-0 group-hover:opacity-100
            "
          >
            Login to access
          </div>
        )}
      </div>

      {/* CHAT WINDOW */}
      <div
        ref={chatRef}
       className={`
        fixed bottom-24 right-6 z-[9999]
        flex w-[360px] max-w-[calc(100vw-24px)] flex-col overflow-hidden
        rounded-[26px] border border-gray-200/80
        bg-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]
        transition-all duration-300 ease-out
          ${open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
          }
        `}
        style={{ height: "500px" }}
      >
      {/* HEADER */}
      <div className="px-3 pt-3 pb-2 bg-transparent">
        <div
          className="
            relative flex items-center justify-between
            rounded-[22px]
            bg-gradient-to-r from-[#2563eb] to-[#3b82f6]
            px-4 py-3 text-white
            shadow-[0_6px_18px_rgba(37,99,235,0.14)]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-white/5" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl ring-white/20">
              <img
                src="/chatbot-logo.png"
                alt="Assistant Logo"
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>

            <div>
              <p className="text-[13.5px] font-semibold tracking-[0.2px] leading-tight">
                Lakbay Lanao Assistant
              </p>
              <p className="text-[11.5px] text-blue-100/90 leading-tight">
                Smart Tourism Guide
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear Chat History"
              className="
                relative text-[17px] text-white/80 p-1.5 rounded-lg
                transition hover:bg-white/10 hover:text-white
              "
            >
              <FiTrash2 />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="
                relative text-xl text-white/90 p-1.5 rounded-lg leading-none
                transition hover:bg-white/10 hover:text-white
              "
            >
              ✕
            </button>
          </div>
        </div>
      </div>

        {/* CUSTOM CONFIRMATION MODAL OVERLAY */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm p-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-6 w-full max-w-[280px] text-center">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-2xl" />
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 mb-1.5">Clear Chat?</h3>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to delete this conversation? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowClearConfirm(false);
                    clearChatHistory();
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT BODY */}
       <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-3.5 py-4">
          {messages.map((msg, index) => {
            if (msg.sender === "suggestions") {
              if (!suggestionsVisible) return null;
              return (
                <div key={index} className="space-y-2 flex flex-col items-start">
                  {msg.options.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="
                       block max-w-[85%] rounded-2xl border border-gray-200
                      bg-white px-5 py-2 text-left text-[12px] font-medium text-gray-700
                      shadow-sm transition-all duration-200
                      hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700
                       
                      "
                    >
                      {q}
                    </button>
                  ))}
                </div>
              );
            }

            const isUser = msg.sender === "user";
            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? "rounded-[18px] rounded-br-md bg-[#2563eb] text-white leading-6"
                    : "rounded-[18px] rounded-bl-md border border-gray-200 bg-white text-gray-800"
                }`}
                >
                  {isUser ? (
                    msg.text
                  ) : (
                   <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-1 last:mb-0 text-[13px] leading-[1.5]">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-700">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-1 ml-4 list-disc space-y-0.5 text-[13px] leading-[1.5]">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-1 ml-4 list-decimal space-y-0.5 text-[13px] leading-[1.5]">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-[1.5]">{children}</li>
                      ),
                      h1: ({ children }) => (
                        <h1 className="mb-1 text-[14px] font-bold leading-[1.4] text-gray-900">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-1 text-[13px] font-bold leading-[1.4] text-gray-900">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-1 text-[13px] font-semibold leading-[1.4] text-gray-800">
                          {children}
                        </h3>
                      ),
                      code: ({ inline, children }) =>
                        inline ? (
                          <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] text-blue-700">
                            {children}
                          </code>
                        ) : (
                          <pre className="mb-2 overflow-x-auto rounded-xl bg-gray-100 p-3 font-mono text-[11px] text-gray-800">
                            <code>{children}</code>
                          </pre>
                        ),
                      blockquote: ({ children }) => (
                        <blockquote className="mb-2 border-l-4 border-blue-300 pl-3 italic text-[13px] leading-[1.5] text-gray-600">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {children}
                        </a>
                      ),
                      hr: () => <hr className="my-2 border-gray-200" />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-[20px] rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="border-t border-gray-100 bg-white px-3 py-2.5">
         <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
              placeholder="Ask about destinations, hotels, events..."
              className="
                flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none
                placeholder:text-gray-500
              "
            />

            <button
              onClick={() => sendMessage(input)}
              className="
                flex h-10 w-10 items-center justify-center rounded-full
                bg-[#2563eb] text-white
                transition-all duration-200
                hover:scale-105 hover:bg-blue-700
              "
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TourismChatbot;