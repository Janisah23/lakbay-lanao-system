<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a6b3c,100:f5a623&height=200&section=header&text=LAKBAY%20LANAO&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Your%20Gateway%20to%20the%20Land%20of%20the%20Lake&descAlignY=58&descSize=18&animation=fadeIn" width="100%" />

<br/>

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=20232A)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=1a1a1a)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/products/hosting)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG_Engine-6B46C1?style=for-the-badge&logo=databricks&logoColor=white)](https://www.trychroma.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

[![Status](https://img.shields.io/badge/Status-In_Development-f5a623?style=for-the-badge)]()
[![Type](https://img.shields.io/badge/Type-Capstone_Project-1a6b3c?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Academic_Use_Only-lightgrey?style=for-the-badge)](LICENSE)

<br/>

> *"Discover Lanao del Sur — its lakes, its culture, its stories — all in one place."*

</div>

<p align="center">
  🌐 Cloud Hosted via <b>Firebase Hosting</b> · 🤖 AI-Powered Tourism Platform · 🗺️ Built for Lanao del Sur
</p>

---

## 🗺️ What is LAKBAY LANAO?

**LAKBAY LANAO** is a web-based interactive tourist guide system developed for the **Provincial Tourism, Culture, and the Arts Office (PTCAO) of Lanao del Sur**. It centralizes tourism information that was previously scattered across social media pages, printed brochures, and informal word-of-mouth — and delivers it through a modern, AI-enhanced platform that works for first-time visitors and local tourism officers alike.

At its core, LAKBAY LANAO combines an **AI-powered chatbot using Retrieval-Augmented Generation (RAG)**, an **interactive tourism map**, a **multimedia gallery**, and a full **content management system** — giving both tourists and tourism staff a single, reliable platform for discovering and promoting the destinations, events, and cultural heritage of Lanao del Sur.

This is a capstone research project submitted to the **College of Information and Computing Sciences, Mindanao State University – Main Campus**, in partial fulfillment of the requirements for the degree of **Bachelor of Science in Information Technology**.

> 🚀 **Deployment Status:** LAKBAY LANAO is deployed using Firebase Hosting for cloud-based accessibility and scalable web delivery. This project remains an academic capstone prototype intended for research and demonstration purposes.
---

## 📸 Project Preview

<div align="center">

| | |
|:---:|:---:|
| ![Landing Page](https://via.placeholder.com/480x270/1a6b3c/ffffff?text=Landing+Page) | ![Interactive Map](https://via.placeholder.com/480x270/1a4080/ffffff?text=Interactive+Map) |
| *Landing Page* | *Interactive Tourism Map* |
| ![AI Chatbot](https://via.placeholder.com/480x270/6B46C1/ffffff?text=AI+Chatbot+%E2%80%94+RAG+Engine) | ![Itinerary Builder](https://via.placeholder.com/480x270/f5a623/1a1a1a?text=Itinerary+Builder) |
| *AI-Powered Chatbot (RAG)* | *Itinerary Builder* |
| ![Gallery](https://via.placeholder.com/480x270/2d2d2d/ffffff?text=Multimedia+Gallery) | ![Dashboard](https://via.placeholder.com/480x270/0f4c75/ffffff?text=Admin+Dashboard) |
| *Multimedia Gallery* | *Analytics Dashboard* |

> 🎬 **Demo GIF:** `[to be added upon project completion]`

</div>

---

## ✈️ Why LAKBAY LANAO?

Lanao del Sur is home to Lake Lanao — one of the oldest and most biodiverse lakes in the world — along with centuries-old meranaw culture, natural wonders, and heritage sites that remain largely undiscovered by the broader tourism landscape. The problem is not the destinations; it is accessibility of information.

**LAKBAY LANAO exists because:**

- Tourism information for Lanao del Sur has no centralized digital home
- Potential visitors cannot find reliable, updated, and structured travel data online
- Tourism officers lack digital tools for content management and visitor analytics
- Existing general-purpose platforms (Google, social media) do not reflect local tourism context accurately

LAKBAY LANAO fills that gap — built specifically for this province, managed by local tourism staff, and powered by AI that actually understands Lanao.

---

## 🧭 Feature Map

<details open>
<summary><b>🤖 AI-Powered Chatbot (RAG Engine)</b></summary>

> An intelligent conversational assistant trained on curated tourism data from Lanao del Sur. Unlike generic AI chatbots, LAKBAY's chatbot uses **Retrieval-Augmented Generation (RAG)** to answer questions with verified, locally-relevant information — pulling from a managed knowledge base rather than hallucinating from general training data.

- Natural language Q&A about destinations, culture, events, and travel tips
- Context-aware follow-up responses
- Powered by **ChromaDB** vector store + LLM inference
- Knowledge base manageable by tourism staff through the CMS

</details>

<details>
<summary><b>🗺️ Interactive Tourism Map</b></summary>

> A Google Maps-integrated layer that plots tourism destinations, heritage sites, natural attractions, and points of interest across Lanao del Sur.

- Clickable destination pins with rich info popups
- Filter by category (nature, heritage, food, events)
- Directions and distance estimation
- Linked to the destination detail pages

</details>

<details>
<summary><b>📅 Itinerary Builder</b></summary>

> A drag-and-drop trip planner that lets tourists organize their visit day by day.

- Add and reorder destinations per day
- Estimated travel time between stops
- Export or share itinerary
- Saved under user profile (authenticated tourists)

</details>

<details>
<summary><b>🖼️ Multimedia Gallery</b></summary>

> A curated photo and video gallery for each destination, managed through Cloudinary CDN.

- High-resolution destination photography
- Video clips and virtual walk-throughs
- Organized by destination and category
- Lazy-loaded for performance

</details>

<details>
<summary><b>📆 Events & Calendar</b></summary>

> A centralized events board for festivals, cultural shows, and tourism activities in the province.

- Monthly calendar view
- Event detail pages with date, venue, and description
- Tourism staff can post and manage events via CMS

</details>

<details>
<summary><b>⭐ Ratings & Feedback System</b></summary>

> Tourists can rate destinations and leave written reviews.

- 5-star rating per destination
- Moderated review submission
- Aggregated rating display on destination cards
- Feedback visible to tourism staff in the dashboard

</details>

<details>
<summary><b>🔖 Favorites Management</b></summary>

> Authenticated tourists can save and revisit destinations they are interested in.

- Add/remove from favorites with one click
- Accessible from user profile
- Persisted to Firestore per user account

</details>

<details>
<summary><b>🛠️ Tourism Content Management System (CMS)</b></summary>

> Tourism staff can add, update, and remove destinations, media, events, and announcements — no developer intervention needed.

- Destination CRUD (with image upload to Cloudinary)
- Event management
- Gallery management
- Review moderation

</details>

<details>
<summary><b>🧠 AI Knowledge Base Management</b></summary>

> Staff can manage the documents and content that feed the RAG chatbot.

- Upload and index new tourism documents
- Edit or remove outdated knowledge entries
- ChromaDB vector store updates in real-time

</details>

<details>
<summary><b>📊 Analytics Dashboard</b></summary>

> Administrators have access to a data overview of platform activity.

- Visitor count and engagement metrics
- Most-viewed destinations
- Chatbot query logs
- Feedback and rating summaries

</details>

---

## 👥 User Roles & Permissions

| Capability | 🧳 Tourist | 🏛️ Tourism Staff | 🔐 Administrator |
|---|:---:|:---:|:---:|
| Browse destinations & map | ✅ | ✅ | ✅ |
| Use AI chatbot | ✅ | ✅ | ✅ |
| Build & save itinerary | ✅ (auth) | ✅ | ✅ |
| Rate & review destinations | ✅ (auth) | ✅ | ✅ |
| Save favorites | ✅ (auth) | ✅ | ✅ |
| Manage destinations & events | ❌ | ✅ | ✅ |
| Manage media gallery | ❌ | ✅ | ✅ |
| Manage AI knowledge base | ❌ | ✅ | ✅ |
| Moderate reviews | ❌ | ✅ | ✅ |
| View analytics dashboard | ❌ | ✅ | ✅ |
| Manage user accounts | ❌ | ❌ | ✅ |
| System configuration | ❌ | ❌ | ✅ |

---

## 🧠 AI Architecture — How the Chatbot Works

LAKBAY LANAO's chatbot does not rely on general-purpose AI knowledge. It uses a **RAG (Retrieval-Augmented Generation)** pipeline to answer questions using verified, locally-curated tourism data.

```
User Question
     │
     ▼
┌─────────────────────────────────┐
│         React Frontend          │
│   (Chat UI — streaming reply)   │
└────────────┬────────────────────┘
             │ HTTP POST /api/chat
             ▼
┌─────────────────────────────────┐
│      Express.js API Server      │
│  (query preprocessing & routing)│
└────────────┬────────────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
┌──────────┐    ┌───────────────────────┐
│ChromaDB  │    │   LLM Inference Layer │
│Vector DB │    │  (answer generation)  │
│          │◄───│                       │
│Semantic  │    │ Context: retrieved    │
│Search    │    │ chunks from ChromaDB  │
└──────────┘    └───────────┬───────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Response Stream │
                   │ → React Chat UI │
                   └─────────────────┘
```

**The pipeline in plain terms:**

1. A tourist asks: *"What are the best places to visit near Lake Lanao?"*
2. The question is converted into a **vector embedding** and searched against ChromaDB
3. ChromaDB returns the **most semantically relevant document chunks** from the tourism knowledge base
4. Those chunks are injected as context into the LLM prompt
5. The LLM generates a grounded, specific answer — not a hallucinated one

This means the chatbot only answers with what tourism staff have actually put into the knowledge base, making it accurate and locally-relevant by design.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│              React 18 + Vite + Tailwind CSS                    │
│   ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────┐  │
│   │ Tourist  │ │  Tourism │ │   Admin   │ │  AI Chatbot   │  │
│   │  Portal  │ │  Staff   │ │ Dashboard │ │  Interface    │  │
│   └──────────┘ └──────────┘ └───────────┘ └───────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │ REST API / HTTPS
┌───────────────────────────▼────────────────────────────────────┐
│                       SERVER LAYER                             │
│                  Node.js + Express.js                          │
│   ┌───────────┐ ┌─────────────┐ ┌───────────┐ ┌───────────┐  │
│   │ Auth      │ │  Tourism    │ │  Chatbot  │ │ Analytics │  │
│   │ Middleware│ │  API Routes │ │  Pipeline │ │  Routes   │  │
│   └───────────┘ └─────────────┘ └───────────┘ └───────────┘  │
└───────┬───────────────┬──────────────┬─────────────┬──────────┘
        │               │              │             │
┌───────▼────┐  ┌───────▼────┐  ┌─────▼──────┐ ┌───▼─────────┐
│  Firebase  │  │ Cloudinary │  │  ChromaDB  │ │ Google Maps │
│  Auth +    │  │ Media CDN  │  │  Vector DB │ │    API      │
│  Firestore │  │            │  │  (RAG)     │ │             │
└────────────┘  └────────────┘  └────────────┘ └─────────────┘
```

---

## 🔄 System Workflow

```
Visitor arrives at LAKBAY LANAO
          │
          ▼
    Browses destination catalog, map, gallery, events
          │
     Interested?
          │
    ┌─────┴──────┐
    │            │
 Has questions   Wants to plan
    │            │
    ▼            ▼
AI Chatbot   Itinerary Builder
(RAG-based)  (day-by-day planner)
    │            │
    └─────┬──────┘
          │
     Wants to save or engage?
          │
          ▼
     Create account / Login
     (Firebase Authentication)
          │
          ▼
  Save favorites, write reviews,
  export itinerary
          │
          ▼
   Tourism Staff reviews feedback
   and manages content via CMS
          │
          ▼
  Admin monitors analytics
  and manages system
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | Component-based UI with fast HMR |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Node.js + Express.js | REST API server and business logic |
| **Authentication** | Firebase Authentication | Secure email/password login |
| **Database** | Firebase Firestore | NoSQL cloud database for all app data |
| **Media Storage** | Cloudinary | Image and video CDN with transformation |
| **AI Vector Store** | ChromaDB | Semantic search engine for RAG pipeline |
| **Maps** | Google Maps API | Interactive destination map |
| **Hosting & Deployment** | Firebase Hosting | Secure and scalable cloud hosting |

---



## 📁 Folder Structure

```
lakbay-lanao/
│
├── client/                          # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Static images, icons, fonts
│   │   ├── components/              # Reusable UI components
│   │   │   ├── common/              # Navbar, Footer, Modal, Loader
│   │   │   ├── map/                 # Map components (Google Maps)
│   │   │   ├── chatbot/             # Chat UI components
│   │   │   └── gallery/             # Media gallery components
│   │   ├── pages/                   # Page-level components
│   │   │   ├── tourist/             # Tourist-facing pages
│   │   │   ├── staff/               # Tourism staff CMS pages
│   │   │   └── admin/               # Admin dashboard pages
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # React context (auth, user)
│   │   ├── services/                # API call functions
│   │   ├── utils/                   # Helper utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Node.js + Express backend
│   ├── controllers/                 # Route handler logic
│   │   ├── authController.js
│   │   ├── destinationController.js
│   │   ├── chatbotController.js
│   │   ├── eventController.js
│   │   ├── galleryController.js
│   │   ├── itineraryController.js
│   │   └── analyticsController.js
│   ├── routes/                      # Express route definitions
│   ├── middleware/                  # Auth verification, error handling
│   ├── services/
│   │   ├── firebaseService.js       # Firestore operations
│   │   ├── cloudinaryService.js     # Media upload/management
│   │   └── ragService.js            # ChromaDB + LLM pipeline
│   ├── config/
│   │   ├── firebase.js              # Firebase Admin SDK init
│   │   └── chroma.js                # ChromaDB client init
│   ├── .env
│   └── index.js
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📡 API Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/verify` | Verify Firebase ID token | All |
| `GET` | `/api/destinations` | Get all destinations | All |
| `GET` | `/api/destinations/:id` | Get destination details | All |
| `POST` | `/api/destinations` | Create new destination | Staff, Admin |
| `PUT` | `/api/destinations/:id` | Update destination | Staff, Admin |
| `DELETE` | `/api/destinations/:id` | Delete destination | Admin |
| `GET` | `/api/events` | Get all events | All |
| `POST` | `/api/events` | Create new event | Staff, Admin |
| `POST` | `/api/chat` | Send message to AI chatbot | All |
| `GET` | `/api/knowledge` | Get knowledge base entries | Staff, Admin |
| `POST` | `/api/knowledge` | Add knowledge base document | Staff, Admin |
| `DELETE` | `/api/knowledge/:id` | Remove knowledge base entry | Staff, Admin |
| `POST` | `/api/itinerary` | Save itinerary | Tourist (auth) |
| `GET` | `/api/itinerary/:userId` | Get user itineraries | Tourist (auth) |
| `POST` | `/api/ratings` | Submit destination rating | Tourist (auth) |
| `GET` | `/api/analytics/overview` | Get analytics summary | Admin |

---

## 🚀 Deployment

LAKBAY LANAO is deployed using **Firebase Hosting**, providing fast, secure, and reliable cloud-based hosting powered by Google infrastructure.

| Component | Platform |
|---|---|
| Frontend Hosting | Firebase Hosting |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Media Storage | Cloudinary |
| Backend API | Node.js + Express.js |
| AI Vector Store | ChromaDB |
| Maps Integration | Google Maps API |

### 🌐 Deployment Highlights

- Global CDN-powered hosting through Firebase
- HTTPS-enabled secure deployment
- Optimized frontend delivery and caching
- Cloud-managed authentication and database services
- Scalable infrastructure suitable for future expansion

> ⚠️ Note: The current deployment is intended for academic demonstration and research evaluation purposes.

## 🔮 Future Enhancements

The following features are out of scope for this capstone iteration but are planned for future development:

- **Multilingual Support** — Meranaw and Filipino language interface options
- **Offline Mode** — PWA support for destinations browsable without connection
- **AR Destination Preview** — Augmented reality previews of popular sites
- **Real-Time Chat** — Tourist-to-staff live messaging support
- **Mobile App** — React Native companion app
- **Trip Sharing** — Share itineraries via link or QR code
- **Weather Integration** — Live weather data per destination
- **Accessibility Features** — Screen reader support, high-contrast mode
- **Government API Integration** — Direct data sync with PTCAO records

---

## 🔒 Security Notes

- All routes that modify data require a valid **Firebase ID Token** verified server-side via the Admin SDK
- **Firestore Security Rules** provide a second layer of access control independent of the API
- Media uploads are validated on the server before being sent to Cloudinary
- ChromaDB is not exposed publicly — all RAG queries go through the Express API layer
- `.env` files are excluded from version control in all directories

---

## 👩‍💻 Researchers & Developers

<div align="center">

| Name | Role |
|---|---|
| **Jonaidah Caris** | Frontend Developer & UI/UX Design |
| **Janisah Macarimbang** | Backend Developer — API & Database |
| **Jonaidah Caris & Janisah Macarimabang** | System Analyst, Documentation, & QA |
| **Omar Mohaymen** | AI Integration |

</div>


---

## 🙏 Acknowledgment

The researchers would like to extend their sincere gratitude to the following:

- **[Faculty Advisers]** — for guidance, technical mentorship, and continued support throughout the development of this system
- **Provincial Tourism, Culture, and the Arts Office (PTCAO) of Lanao del Sur** — for the institutional partnership, data support, and trust placed in this research
- **[Capstone Coordinator / Panel Members]** — for the valuable feedback and academic direction

---

## 🤝 Contributing

This project is an academic capstone and is not open for external contributions at this time. If you are a researcher or developer interested in extending this system, please reach out to the team directly.

---

## 📄 License

This project is developed for **academic and research purposes only**. Redistribution, commercial use, or deployment without the consent of the developers and the Provincial Tourism Office of Lanao del Sur is not permitted.

© 2025–2026 LAKBAY LANAO

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:f5a623,100:1a6b3c&height=120&section=footer" width="100%" />

*"Every journey begins with a single step. Yours begins here."*

**LAKBAY LANAO** · Lanao del Sur, Philippines 🇵🇭

</div>
