import { useState, useEffect, useRef } from "react";
import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { FiTrash2 } from "react-icons/fi";

import chatbotIcon from "../../assets/chatbot-icon.png";
import chatbotAvatar from "../../assets/chatbot-icons.png";
import lakbayLogo from "../../assets/lakbay-logos.png";

const DEFAULT_MESSAGES = [
  {
    sender: "welcome",
  },
  {
    sender: "suggestions",
    options: [
      "Tell me about Maranao history",
      "What is Lanao del Sur known for?",
      "Suggest cultural sites to visit",
      "Help me plan a Lanao trip",
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
  const [showPromptBubble, setShowPromptBubble] = useState(true);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);

  const navigate = useNavigate();
  const location = useLocation();

  const chatRef = useRef(null);
  const buttonRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  useEffect(() => {
    if (!user) return;

    const isDefaultChat =
      messages.length === 2 &&
      messages[0]?.sender === "welcome" &&
      messages[1]?.sender === "suggestions";

    if (isDefaultChat) return;

    setDoc(doc(db, "userChats", user.uid), { messages }).catch(console.error);
  }, [messages, user]);

  useEffect(() => {
    const openChatbot = () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      setOpen(true);
      setManuallyOpen(true);
      setShowPromptBubble(false);
    };

    window.addEventListener("open-tourism-chatbot", openChatbot);

    return () => {
      window.removeEventListener("open-tourism-chatbot", openChatbot);
    };
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, "userChats", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().messages?.length) {
            setMessages(docSnap.data().messages);

            const hasOnlyDefaultMessages =
              docSnap.data().messages.length === 2 &&
              docSnap.data().messages[0]?.sender === "welcome" &&
              docSnap.data().messages[1]?.sender === "suggestions";

            setSuggestionsVisible(hasOnlyDefaultMessages);
          } else {
            setMessages(DEFAULT_MESSAGES);
            setSuggestionsVisible(true);
          }
        } catch (err) {
          console.error("Failed to recover chat:", err);
          setMessages(DEFAULT_MESSAGES);
          setSuggestionsVisible(true);
        }
      } else {
        setMessages(DEFAULT_MESSAGES);
        setSuggestionsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (location.pathname !== lastPath) {
      setLastPath(location.pathname);

      if (manuallyOpen) {
        setManuallyOpen(false);
      }
    }
  }, [location.pathname, lastPath, manuallyOpen]);

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

  useEffect(() => {
    if (open) {
      setShowPromptBubble(false);
      return;
    }

    setShowPromptBubble(true);

    const timer = setTimeout(() => {
      setShowPromptBubble(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, [open]);

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
      <style>{`
        @keyframes chatbotPop {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          12% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          82% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
          }
        }

        .animate-chatbot-pop {
          animation: chatbotPop 6s ease-in-out;
        }
      `}</style>

      {/* FLOATING CHATBOT BUTTON */}
      <div
        ref={buttonRef}
        className="fixed bottom-6 right-5 z-[999] md:bottom-10 md:right-10"
      >
        {!open && showPromptBubble && (
          <div className="pointer-events-none absolute bottom-[72px] right-0 w-[215px] animate-chatbot-pop rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-left shadow-[0_12px_28px_rgba(37,99,235,0.14)] md:bottom-3 md:right-[78px]">
            <p className="text-[12px] font-bold text-[#2563eb]">
              Hello, need help?
            </p>

            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
              Ask me about places, events, food spots, and travel tips.
            </p>

            <span className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 border-b border-r border-blue-100 bg-white md:-right-1.5 md:bottom-5 md:border-b-0 md:border-l-0 md:border-r md:border-t" />
          </div>
        )}

        <button
          className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 md:h-[66px] md:w-[66px]"
          onClick={() => {
            if (!user) {
              navigate("/login");
              return;
            }

            setOpen((prev) => !prev);
            setManuallyOpen(true);
            setShowPromptBubble(false);
          }}
          aria-label="Open tourism chatbot"
        >
          <img
            src={chatbotIcon}
            alt="Chatbot"
            className="h-full w-full rounded-full object-contain drop-shadow-[0_10px_24px_rgba(37,99,235,0.22)]"
          />
        </button>
      </div>

      {/* CHAT WINDOW */}
      <div
        ref={chatRef}
        className={`
          fixed z-[9999] flex flex-col overflow-hidden
          rounded-[26px] border border-blue-100 bg-white
          shadow-[0_18px_42px_rgba(37,99,235,0.14)]
          transition-all duration-300 ease-out

          bottom-[88px] right-3 left-3 h-[72vh] max-h-[520px] w-auto
          md:bottom-[112px] md:right-10 md:left-auto md:h-[540px] md:w-[360px]

          ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-95 opacity-0"
          }
        `}
      >
        {/* HEADER */}
        <div className="border-b border-blue-50 bg-white px-3 pb-3 pt-3">
          <div className="relative flex items-center justify-between rounded-[20px] bg-[#2563eb] px-4 py-3 text-white shadow-[0_8px_18px_rgba(37,99,235,0.16)]">
            <div className="flex items-center gap-3">
              <img
                src={chatbotAvatar}
                alt="Assistant Logo"
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="text-[13.5px] font-bold leading-tight">
                  iRanao Guide
                </p>
                <p className="text-[11px] font-medium leading-tight text-blue-100">
                  Smart Tourism Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear Chat History"
                className="rounded-full p-1.5 text-[17px] text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <FiTrash2 />
              </button>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-lg leading-none text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* CLEAR MODAL */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/75 p-6 backdrop-blur-[2px]">
            <div className="w-full max-w-[280px] rounded-[24px] border border-blue-100 bg-white p-6 text-center shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <FiTrash2 className="text-2xl" />
              </div>

              <h3 className="mb-1.5 text-[17px] font-bold text-gray-900">
                Clear Chat?
              </h3>

              <p className="mb-6 text-[13px] leading-relaxed text-gray-500">
                Are you sure you want to delete this conversation? This cannot be
                undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-[16px] bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowClearConfirm(false);
                    clearChatHistory();
                  }}
                  className="flex-1 rounded-[16px] bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(239,68,68,0.20)] transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT BODY */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbff] px-3.5 py-4">
          {messages.map((msg, index) => {
            if (msg.sender === "welcome") {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center px-4 pb-3 pt-5 text-center"
                >
                  <img
                    src={lakbayLogo}
                    alt="Lakbay Lanao Assistant"
                    className="mb-4 h-16 w-auto object-contain md:h-[72px]"
                  />

                  <p className="mt-1 text-[13px] font-bold text-[#2563eb]">
                    Sallam, how can we help you?
                  </p>

                  <p className="mt-3 max-w-[285px] text-[12.5px] leading-[1.6] text-gray-500">
                    Ask about destinations, events, hotels, food spots, cultural
                    heritage, travel tips, and the rich Maranao history of Lanao
                    del Sur.
                  </p>
                </div>
              );
            }

            if (msg.sender === "suggestions") {
              if (!suggestionsVisible) return null;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2.5 pb-2"
                >
                  {msg.options.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="block w-full max-w-[88%] rounded-[18px] border border-blue-100 bg-white px-4 py-2.5 text-left text-[12.5px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb]"
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
                      ? "rounded-[20px] rounded-br-md bg-[#2563eb] leading-6 text-white"
                      : "rounded-[20px] rounded-bl-md border border-blue-100 bg-white text-gray-800"
                  }`}
                >
                  {isUser ? (
                    msg.text
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-1 text-[13px] leading-[1.5] last:mb-0">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
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
                          <blockquote className="mb-2 border-l-4 border-blue-300 pl-3 text-[13px] italic leading-[1.5] text-gray-600">
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
                      {msg.text || ""}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-[20px] rounded-bl-md border border-blue-100 bg-white px-4 py-3 shadow-sm">
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
        <div className="border-t border-blue-50 bg-white px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white px-2 py-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_6px_16px_rgba(37,99,235,0.08)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
              placeholder="Ask about destinations..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />

            <button
              onClick={() => sendMessage(input)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-[0_6px_14px_rgba(37,99,235,0.20)] transition-all duration-200 hover:scale-105 hover:bg-blue-700"
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