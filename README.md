# Safar

**A workspace that never loses signal.**

Safar is an offline-first, browser-based development studio that lets you write code, create rich documents, and stay productive — even without internet. Everything is saved locally in your browser's IndexedDB and automatically syncs to the cloud when connectivity returns.

---

## The Problem

Millions of people travel daily and face a common frustration:

| Situation | Impact |
|:---|:---|
| No internet in trains/metros | Can't access cloud apps |
| Unstable mobile data | Documents fail to load or save |
| Long travel hours | Wasted productive time |

Popular tools like Google Docs, Notion, and VS Code Web all **require internet** to function. Safar doesn't.

---

## The Solution

Safar is a **web-based, offline-first workspace** that works entirely in your browser. It stores everything locally, feels like a professional IDE, and silently syncs to the cloud the moment internet becomes available.

---

## Features

### Code Editor
- **Monaco Editor** (same engine as VS Code) with syntax highlighting, bracket matching, and IntelliSense
- Support for **12+ languages**: JavaScript, TypeScript, Python, HTML, CSS, JSON, Java, C, C++, Markdown, and more
- JetBrains Mono font, smooth cursor, and line highlighting
- **In-browser code runner** — execute JS and HTML files directly with console output

### Rich Document Editor
- **Tiptap-based** WYSIWYG editor for `.sdoc` files
- Bold, italic, underline, highlight, text color, font family, font size
- Tables, task lists (checkboxes), text alignment, links
- **Export to PDF** with one click
- Character count

### AI Coding Assistant
- Built-in **Gemini AI** chat panel (BYOK — Bring Your Own Key)
- Supports multiple models: Gemini 2.5 Flash, 2.5 Pro, 2.0 Flash, 1.5 Flash
- **Fetch available models** dynamically from your API key
- Sends active file as context for precise code suggestions
- **Smart Apply** — AI suggestions are applied directly to your editor using SEARCH/REPLACE blocks or full file replacement

### Offline-First Architecture
- All files, folders, and workspaces stored in **IndexedDB**
- Works 100% offline — no internet needed to create, edit, or organize
- **Truthful sync status indicator**: SAVING → SYNCING → SYNCED / OFFLINE / LOCAL / ERROR
- Automatic sync when internet returns (within seconds)

### Workspace Management
- Create multiple workspaces
- Nested folder structure with file tree navigation
- File search/filter in sidebar
- Support for multiple file types: Code, Document, Text, Markdown, Folder

### Version History
- View version history for any file
- Restore previous versions with one click

### Theme Support
- Light and dark themes
- Custom Monaco themes (Architect Studio / Architect Dark)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **TypeScript 5.9** | Type safety |
| **Monaco Editor** | Code editing (VS Code engine) |
| **Tiptap** | Rich document editing (WYSIWYG) |
| **IndexedDB** (via `idb`) | Local offline storage |
| **Framer Motion** | Animations |
| **Lucide React** | Icons |
| **Axios** | HTTP client |
| **diff / diff-match-patch** | Smart patch application for AI code suggestions |
| **html2pdf.js** | PDF export for documents |

### Backend
| Technology | Purpose |
|:---|:---|
| **Node.js + Express 5** | REST API server |
| **TypeScript** | Type safety |
| **Prisma** | ORM for MongoDB |
| **MongoDB Atlas** | Cloud database |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |

### External Services
| Service | Purpose |
|:---|:---|
| **Google Gemini API** | AI coding assistant (client-side, BYOK) |
| **MongoDB Atlas** | Cloud data persistence |

---

## Project Structure

```
Safar/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.tsx           # Login / Register modal
│   │   │   ├── ChatPanel.tsx      # AI assistant panel
│   │   │   ├── Dashboard.tsx      # Landing page with mode selection
│   │   │   ├── DocEditor.tsx      # Rich document editor (Tiptap)
│   │   │   ├── Editor.tsx         # Code editor (Monaco)
│   │   │   ├── Modal.tsx          # Create file/workspace modals
│   │   │   ├── Runner.tsx         # In-browser code runner
│   │   │   ├── Sidebar.tsx        # File tree navigation
│   │   │   ├── Topbar.tsx         # Tabs, sync status, actions
│   │   │   └── VersionModal.tsx   # Version history viewer
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios HTTP client
│   │   │   ├── db.ts              # IndexedDB operations
│   │   │   ├── patchUtils.ts      # Smart code apply (SEARCH/REPLACE + diff)
│   │   │   └── syncService.ts     # Client-side sync engine
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types and enums
│   │   ├── App.tsx                # Main application component
│   │   └── index.css              # Global styles
│   └── package.json
│
├── server/                    # Express backend
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── AuthController.ts
│   │   │   ├── FileController.ts
│   │   │   ├── SyncController.ts
│   │   │   └── WorkspaceController.ts
│   │   ├── models/
│   │   │   ├── BaseEntity.ts      # Abstract base class
│   │   │   ├── User.ts
│   │   │   ├── Workspace.ts
│   │   │   ├── FileNode.ts
│   │   │   ├── FileVersion.ts
│   │   │   └── SyncLog.ts
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   ├── FileService.ts
│   │   │   ├── SyncService.ts
│   │   │   └── WorkspaceService.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts               # Express server entry point
│   └── package.json
│
├── useCaseDiagram.md          # UML Use Case Diagram
├── classDiagram.md            # UML Class Diagram
├── erDiagram.md               # Entity Relationship Diagram
├── sequenceDiagram.md         # Sequence Diagrams
└── idea.md                    # Original project concept
```

---

## Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm**
- A **MongoDB Atlas** cluster (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/codervipul775/Safar.git
cd Safar
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/safar?retryWrites=true&w=majority"
JWT_SECRET="your-strong-secret-key-here"
PORT=5001
```

Generate the Prisma client and push the schema:

```bash
npx prisma generate
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

The API will be running at `http://localhost:5001`.

### 3. Setup the Client

```bash
cd ../client
npm install
```

Optionally, create a `.env` file in the `client/` directory to override the API URL:

```env
VITE_API_URL=http://localhost:5001/api
```

Start the development server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/profile` | Get current user profile |

### Workspaces
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces` | Get all user workspaces |
| DELETE | `/api/workspaces/:id` | Delete a workspace |

### Files
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/files` | Create a file |
| PUT | `/api/files/:id` | Update a file |
| DELETE | `/api/files/:id` | Delete a file |
| GET | `/api/files/:id` | Get a file by ID |
| GET | `/api/files/tree/:workspaceId` | Get file tree for a workspace |
| GET | `/api/files/:id/versions` | Get version history |
| POST | `/api/files/:id/restore/:versionId` | Restore a version |

### Synchronization
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/sync/push` | Push local changes to cloud |
| POST | `/api/sync/push-workspaces` | Push workspace metadata |
| GET | `/api/sync/pull/:workspaceId` | Pull cloud changes |
| GET | `/api/sync/status/:workspaceId` | Get sync status |

---

## How the Sync Engine Works

```
User edits file
       ↓
Save to IndexedDB (syncStatus: PENDING)
       ↓
Status indicator: SAVING
       ↓
  ┌─── Online? ───┐
  │               │
 YES              NO
  │               │
  ↓               ↓
Push to server   Status: OFFLINE
  ↓               (queued for later)
Server confirms
  ↓
IndexedDB: SYNCED
  ↓
Status: SYNCED ✓
```

When internet returns, a reconnection effect automatically triggers a sync push, and the background interval (every 5 seconds) continues to check for pending changes.

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description | Required |
|:---|:---|:---|
| `DATABASE_URL` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `PORT` | Server port (default: 5001) | No |

### Client (`client/.env`)
| Variable | Description | Required |
|:---|:---|:---|
| `VITE_API_URL` | Backend API URL (default: `http://localhost:5001/api`) | No |

---

## Deployment

### Server (Vercel / Render / Railway)
```bash
cd server
npm run build    # Generates Prisma client + compiles TypeScript
npm start        # Runs the compiled server
```

### Client (Vercel)
```bash
cd client
npm run build    # TypeScript check + Vite production build
```

Set `VITE_API_URL` to your deployed server URL in Vercel environment variables.

---

## UML Documentation

The project includes complete UML documentation:

- **[Use Case Diagram](useCaseDiagram.md)** — All user interactions across 8 modules
- **[Class Diagram](classDiagram.md)** — Full OOP architecture (models, services, controllers)
- **[ER Diagram](erDiagram.md)** — Database entity relationships
- **[Sequence Diagrams](sequenceDiagram.md)** — 10 detailed flow diagrams covering auth, editing, sync, AI, and more

---

## Author

**Vipul Yadav**

---

## License

ISC
