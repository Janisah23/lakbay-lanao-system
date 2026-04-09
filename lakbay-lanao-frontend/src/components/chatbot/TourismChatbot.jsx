import { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

function TourismChatbot() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const chatRef = useRef(null);
  const buttonRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [manuallyOpen, setManuallyOpen] = useState(false);
const [lastPath, setLastPath] = useState(location.pathname);


  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Welcome to Lakbay Lanao Assistant! I can help you explore destinations, events, hotels, and travel tips in Lanao del Sur.",
    },
    {
      sender: "suggestions",
      options: [
        "What is Lakbay Lanao?",
        "Top tourist destinations in Lanao del Sur",
        "Where can I find hotels in Marawi?",
        "Upcoming events in Lanao del Sur",
      ],
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMessage = {
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const botReply = {
        sender: "bot",
        text: "Thanks for your question! Our AI tourism assistant will provide recommendations here once the knowledge system is integrated.",
      };

      setMessages((prev) => [...prev, botReply]);
      setTyping(false);
    }, 1200);
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
            border border-white/70 bg-white/85
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
          flex w-[390px] max-w-[calc(100vw-24px)] flex-col overflow-hidden
          rounded-[32px] border border-white/50
          bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.16)]
          backdrop-blur-md
          transition-all duration-300 ease-out
          ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-95 opacity-0"
          }
        `}
        style={{ height: "500px" }}
      >
        {/* HEADER */}
        <div
          className="
            relative flex items-center justify-between
            border-b border-white/10
            bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]
            px-5 py-4 text-white
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-white/5" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-2.5 ring-1 ring-white/20">
              <img
                src="/chatbot-logo.png"
                alt="Assistant Logo"
                className="w-6"
              />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[0.2px]">
                Lakbay Lanao Assistant
              </p>
              <p className="text-xs text-blue-100/95">
                Smart Tourism Guide
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="
              relative text-xl text-white/90
              transition hover:scale-105 hover:text-white
            "
          >
            ✕
          </button>
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 space-y-4">
          {messages.map((msg, index) => {
            if (msg.sender === "suggestions") {
              return (
                <div key={index} className="space-y-2">
                  {msg.options.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="
                        block w-full rounded-2xl border border-gray-200
                        bg-white px-4 py-3 text-left text-[15px] font-medium text-gray-800
                        shadow-sm transition-all duration-200
                        hover:border-blue-200 hover:bg-blue-50
                      "
                    >
                      {q}
                    </button>
                  ))}
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[86%] px-4 py-3 text-[15px] shadow-sm ${
                    msg.sender === "user"
                      ? "rounded-[20px] rounded-br-md bg-[#2563eb] text-white leading-7"
                      : "rounded-[20px] rounded-bl-md border border-gray-200 bg-white text-gray-800 leading-7"
                  }`}
                >
                  {msg.text}
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
        <div className="border-t border-gray-100 bg-white/95 px-3 py-3">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
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