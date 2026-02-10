# Safar - Project Idea

**Workspace that never loses signal.**

## The Core Problem

Millions of people in India travel daily and face problem:

No internet in trains ----- Can't access cloud apps
Unstable mobile data  -----  Docs fail to load/save
Expensive roaming     -----  Users avoid data usage
Long travel hours     -----  Wasted productive time

**People want to:**
- Write notes and documents
- Code and practice DSA
- Prepare for exams
- Work on office tasks


**But all popular tools fail offline:**
- Google Docs → needs internet to load
- Notion → can't open without sync
- GitHub → useless offline
- VS Code Web → no offline mode


## The Solution: Safar

A **web-based, offline-first workspace** that:
| Feature | How It Works |

| Works 100% offline | Everything saved locally in IndexedDB |
| Feels like a cloud app | Premium UI,file tree,tabs,editor |
| Syncs when internet returns | Auto-push/pull with conflict resolution |
| Works on any device | Responsive PWA (mobile, tablet, laptop) |


##  What Users Can Do

### 1. Create Files
- Plain text notes
- Markdown documents (with live preview)
- Code files (JS, Python, HTML, CSS, JSON, etc.)
- Todo / checklist files

### 2. Organize
- Create folders and nested structures
- Multiple workspaces per user
- File tree navigation (like VS Code)

### 3. Code Offline
- Full code editor with syntax highlighting
- Support for 10+ languages
- Line numbers, bracket matching, auto-indent
- Monospace font (JetBrains Mono)

###  4. Auto Sync
When internet returns:
- Uploads all local changes to cloud (MongoDB)
- Detects conflicts (local vs cloud edits)
- Logs every sync action for auditability
- Shows sync status per file

### 5. Use on Any Device
- **Mobile** — responsive sidebar, touch-friendly
- **Tablet** — split-view editing
- **Laptop** — full workspace with panels
