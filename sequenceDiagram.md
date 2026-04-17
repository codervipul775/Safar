# Safar — Sequence Diagrams

## 1. User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Fill registration form (name, email, password)
    UI->>UI: Validate form inputs
    UI->>API: POST /api/auth/register {name, email, password}
    API->>API: Validate email format
    API->>DB: Check if email already exists
    DB-->>API: Result
    API->>API: Hash password (bcrypt, 10 rounds)
    API->>DB: Create User record
    DB-->>API: User created
    API->>API: Generate JWT token (7d expiry)
    API-->>UI: 201 { token, user }
    UI->>UI: Store token & user in localStorage
    UI-->>User: Show Dashboard
```

---

## 2. User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Enter email & password
    UI->>API: POST /api/auth/login {email, password}
    API->>DB: Find user by email (normalized, lowercase)
    DB-->>API: User record
    API->>API: Compare password hash (bcrypt)
    alt Password matches
        API->>API: Generate JWT token (7d expiry)
        API-->>UI: 200 { token, user }
        UI->>UI: Store token & user in localStorage
        UI-->>User: Redirect to Dashboard
    else Password mismatch
        API-->>UI: 401 { error: "Invalid email or password" }
        UI-->>User: Show error message
    end
```

---

## 3. Create File (Offline-First)

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant IDB as IndexedDB

    User->>UI: Click "New File" → Enter name, select type
    UI->>UI: Detect file type from extension
    UI->>UI: Detect language from extension
    UI->>IDB: Store file { name, type, language, content: "", syncStatus: "PENDING" or "LOCAL_ONLY" }
    IDB-->>UI: File saved locally
    UI->>UI: Build file tree, open tab
    UI-->>User: File appears in sidebar & opens in editor

    Note over UI: Auto-sync interval (5s) will push if online
```

---

## 4. Edit Code File with Auto-Save

```mermaid
sequenceDiagram
    actor User
    participant Monaco as Monaco Editor
    participant UI as React App
    participant IDB as IndexedDB
    participant SE as Sync Engine
    participant API as Express Backend
    participant Cloud as MongoDB

    User->>Monaco: Type code
    Monaco->>UI: onChange(fileId, content)
    UI->>UI: Update activeFile in state (immediate)
    UI->>UI: Mark tab as modified
    UI->>UI: Set status → SAVING
    UI->>UI: Debounce (1 second)

    Note over UI: After 1s of no typing...
    UI->>IDB: saveFile({ content, syncStatus: PENDING, updatedAt: now })
    IDB-->>UI: Saved

    alt User is logged in AND online
        UI->>UI: Set status → SYNCING
        UI->>SE: pushChanges(force=true)
        SE->>IDB: Query files WHERE syncStatus = PENDING
        SE->>API: POST /api/sync/push { changes }
        API->>Cloud: Upsert file records
        Cloud-->>API: Success
        API-->>SE: { results: [{ fileId, status: SUCCESS }] }
        SE->>IDB: Update syncStatus → SYNCED, set syncedAt
        SE-->>UI: syncedCount
        UI->>UI: Set status → SYNCED
    else User is logged in BUT offline
        UI->>UI: Set status → OFFLINE
    else Guest user (not logged in)
        UI->>UI: Set status → LOCAL
    end

    UI->>UI: Mark tab as not modified
    UI->>IDB: Refresh file tree
```

---

## 5. Edit Rich Document

```mermaid
sequenceDiagram
    actor User
    participant Tiptap as Tiptap Editor
    participant UI as React App
    participant IDB as IndexedDB

    User->>Tiptap: Type / format text
    Tiptap->>UI: onContentChange(fileId, htmlContent)
    UI->>UI: Debounce (1 second)

    Note over UI: After 1s of no typing...
    UI->>IDB: saveFile({ content: html, syncStatus: PENDING })
    IDB-->>UI: Saved
    UI-->>User: Status indicator updates

    Note over User,Tiptap: Rich features available
    User->>Tiptap: Bold, Italic, Underline, Highlight
    User->>Tiptap: Insert Table (rows, columns)
    User->>Tiptap: Add Task List (checkboxes)
    User->>Tiptap: Change Font Family, Size, Color
    User->>Tiptap: Text Alignment (left, center, right)
    User->>Tiptap: Insert Link
    User->>Tiptap: Export to PDF
```

---

## 6. Auto Sync When Internet Returns

```mermaid
sequenceDiagram
    participant Browser as Browser Event
    participant UI as React App
    participant SE as Sync Engine
    participant IDB as IndexedDB
    participant API as Express Backend
    participant Cloud as MongoDB

    Browser->>UI: "online" event fired
    UI->>UI: Set isOnline = true

    Note over UI: Reconnection Sync Effect triggers
    UI->>UI: Set status → SYNCING
    UI->>SE: pushChanges(force=true)
    SE->>IDB: Query files WHERE syncStatus = PENDING or LOCAL_ONLY
    IDB-->>SE: [file1, file2, ...]

    SE->>API: POST /api/sync/push { changes: [...] }
    API->>Cloud: Upsert each file record
    Cloud-->>API: Results
    API-->>SE: { results: [{ fileId, status }] }

    loop For each SUCCESS result
        SE->>IDB: Update file syncStatus → SYNCED, set syncedAt
        Note over IDB: Transaction hardened with tx.done
    end

    SE-->>UI: syncedCount
    UI->>UI: Set status → SYNCED
    UI-->>Browser: Green status dot shown

    Note over UI: Background interval (5s) continues checking
```

---

## 7. AI Chat Interaction

```mermaid
sequenceDiagram
    actor User
    participant Chat as ChatPanel
    participant Gemini as Gemini API (Google)
    participant Editor as Monaco Editor
    participant Patch as PatchUtils

    User->>Chat: Configure API key (BYOK)
    Chat->>Chat: Store key in localStorage
    User->>Chat: Click "Fetch Models"
    Chat->>Gemini: GET /v1beta/models?key=...
    Gemini-->>Chat: Available models list
    Chat->>Chat: Sort by version (2.5 > 2.0 > 1.5)

    User->>Chat: Type question (e.g., "fix this function")
    Chat->>Chat: Build prompt with system instructions + active file context
    Chat->>Gemini: POST /v1beta/models/{model}:generateContent
    Gemini-->>Chat: AI response (code block or SEARCH/REPLACE)
    Chat-->>User: Display formatted response

    User->>Chat: Click "Apply" on code block
    Chat->>Patch: smartApply(currentContent, generatedCode)

    alt SEARCH/REPLACE block detected
        Patch->>Patch: Find exact SEARCH text in file
        Patch->>Patch: Replace with REPLACE text
        Patch-->>Editor: Updated content
    else Unified diff detected
        Patch->>Patch: Apply patch with fuzzFactor=3
        Patch-->>Editor: Patched content
    else Full file content
        Patch-->>Editor: Replace entire content
    end

    Editor-->>User: File updated in editor
```

---

## 8. File Version Restore

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Click "History" button in Topbar
    UI->>API: GET /api/files/{fileId}/versions
    API->>DB: Query FileVersions WHERE fileId, ordered by versionNumber DESC
    DB-->>API: [v3, v2, v1]
    API-->>UI: { versions: [...] }
    UI-->>User: Show version list (number, date, Current/Restore buttons)

    User->>UI: Click "Restore" on Version 2
    UI->>UI: Call onRestore(version2.content)
    UI->>UI: onChange(fileId, restoredContent)
    UI-->>User: File content replaced with Version 2
    Note over UI: Normal save flow triggers (auto-save + sync)
```

---

## 9. Workspace Management

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant IDB as IndexedDB
    participant SE as Sync Engine
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Click "New Workspace"
    UI-->>User: Show modal (enter workspace name)
    User->>UI: Enter "My Project" → Click Create

    UI->>IDB: Store workspace { name, syncStatus: PENDING }
    IDB-->>UI: Created
    UI->>UI: Set as active workspace
    UI-->>User: Empty workspace ready

    Note over UI,API: Auto-sync pushes workspace if online
    SE->>IDB: Query workspaces WHERE syncStatus = PENDING
    SE->>API: POST /api/sync/push-workspaces { workspaces }
    API->>DB: Upsert Workspace (with ownerId, ownerEmail)
    DB-->>API: Synced
    API-->>SE: { synced: 1 }
    SE->>IDB: Update syncStatus → SYNCED
```

---

## 10. Run Code in Browser

```mermaid
sequenceDiagram
    actor User
    participant UI as React App
    participant Runner as Runner Component
    participant Iframe as Sandboxed Iframe

    User->>UI: Click "Run" button in Topbar
    UI->>UI: Capture current file content as snapshot
    UI->>Runner: Open Runner panel with code snapshot

    alt HTML file
        Runner->>Iframe: Load HTML content directly via srcdoc
        Iframe-->>User: Rendered HTML page
    else JavaScript file
        Runner->>Iframe: Wrap in HTML with console interceptor
        Iframe->>Iframe: Execute JS, capture console.log/error/warn
        Iframe-->>Runner: PostMessage with console output
        Runner-->>User: Display console logs with color-coded types
    end

    User->>Runner: Click "Refresh" to re-run
    Runner->>Iframe: Reload with latest snapshot
```
