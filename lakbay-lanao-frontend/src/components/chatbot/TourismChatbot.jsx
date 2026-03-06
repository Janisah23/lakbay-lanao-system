import { useState, useEffect } from "react";

function TourismChatbot() {

const [open, setOpen] = useState(false);
const [messages, setMessages] = useState([]);
const [typing, setTyping] = useState(false);
const [input, setInput] = useState("");

const suggestions = [
"What is Lakbay Lanao?",
"Top tourist destinations in Lanao del Sur",
"Where can I find hotels in Marawi?",
"Upcoming events in Lanao del Sur",
"Help me plan my itinerary"
];

useEffect(() => {

if(open && messages.length === 0){

setMessages([
{
sender:"bot",
text:"👋 Welcome to Lakbay Lanao Assistant! I can help you explore destinations, events, hotels, and travel tips in Lanao del Sur."
},
{
sender:"suggestions",
options:suggestions
}
]);

}

},[open]);



const sendMessage = (text) => {

if(!text.trim()) return;

const userMessage = {
sender:"user",
text
};

setMessages(prev => [...prev,userMessage]);
setInput("");
setTyping(true);

setTimeout(()=>{

const botReply = {
sender:"bot",
text:"Thanks for your question! Our AI tourism assistant will provide recommendations here once the knowledge system is integrated."
};

setMessages(prev => [...prev,botReply]);
setTyping(false);

},1200);

};



return (
<>

{/* CHATBOT BUTTON */}

<button
onClick={()=>setOpen(!open)}
className="fixed bottom-6 right-6 z-[9999] hover:scale-110 transition"
>
<img
src="/chatbot-icon.png"
className="w-20 h-20 drop-shadow-2xl"
/>
</button>



{/* CHAT WINDOW */}

{open && (

<div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] border flex flex-col z-[9999] overflow-hidden">

{/* HEADER */}

<div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">

<div className="flex items-center gap-3">

<img src="/chatbot-logo.png" className="w-7"/>

<div>
<p className="font-semibold text-sm">
Lakbay Lanao Assistant
</p>
<p className="text-xs opacity-80">
Tourism Guide System
</p>
</div>

</div>

<button
onClick={()=>setOpen(false)}
className="text-white text-lg hover:opacity-70"
>
✕
</button>

</div>



{/* CHAT AREA */}

<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

{messages.map((msg,index)=>{

if(msg.sender==="suggestions"){
return (

<div key={index} className="space-y-2">

{msg.options.map((q,i)=>(
<button
key={i}
onClick={()=>sendMessage(q)}
className="block w-full text-left text-sm bg-white border px-4 py-2 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition"
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
className={`flex ${msg.sender==="user" ? "justify-end":"justify-start"}`}
>

<div
className={`px-4 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm ${
msg.sender==="user"
? "bg-blue-600 text-white rounded-br-md"
: "bg-white border rounded-bl-md"
}`}
>
{msg.text}
</div>

</div>

);

})}


{typing && (

<div className="text-xs text-gray-400 animate-pulse">
Assistant is typing...
</div>

)}

</div>



{/* INPUT AREA */}

<div className="p-3 border-t bg-white flex items-center gap-2">

<input
type="text"
value={input}
onChange={(e)=>setInput(e.target.value)}
placeholder="Ask about destinations, hotels, events..."
className="flex-1 px-4 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-400"
/>

<button
onClick={()=>sendMessage(input)}
className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-700 transition"
>
➤
</button>

</div>

</div>

)}

</>

);

}

export default TourismChatbot;