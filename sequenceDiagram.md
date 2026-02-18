# SafarSetu Pro — Sequence Diagrams

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
    API->>API: Hash password (bcrypt)
    API->>DB: Create User record
    DB-->>API: User created
    API->>API: Generate JWT token
    API-->>UI: 201 { token, user }
    UI->>UI: Store token in localStorage
    UI->>UI: Redirect to Dashboard
    UI-->>User: Show workspace dashboard
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
    API->>DB: Find user by email
    DB-->>API: User record
    API->>API: Compare password hash (bcrypt)
    alt Password matches
        API->>API: Generate JWT token
        API-->>UI: 200 { token, user }
        UI->>UI: Store token in localStorage
        UI-->>User: Redirect to Dashboard
    else Password mismatch
        API-->>UI: 401 { error: "Invalid credentials" }
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
    participant SW as Service Worker
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Click "New File" → Enter name, select type
    UI->>IDB: Store file { name, type, content: "", syncStatus: "LOCAL_ONLY" }
    IDB-->>UI: File saved locally
    UI-->>User: File appears in tree & opens in editor

    Note over UI,API: If online...
    UI->>UI: Check navigator.onLine
    alt Online
        UI->>API: POST /api/files { name, type, workspaceId }
        API->>DB: Create File record
        DB-->>API: File created
        API-->>UI: 201 { file }
        UI->>IDB: Update syncStatus → "SYNCED", set syncedAt
    else Offline
        UI->>IDB: Keep syncStatus as "LOCAL_ONLY"
        Note over IDB: Will sync later when online
    end
```

---

## 4. Edit File with Auto-Save

```mermaid
sequenceDiagram
    actor User
    participant Editor as CodeMirror Editor
    participant UI as React Frontend
    participant IDB as IndexedDB

    User->>Editor: Type code / text
    Editor->>UI: onChange event (content changed)
    UI->>UI: Debounce (2 seconds)

    Note over UI: After 2s of no typing...
    UI->>IDB: Update file content & updatedAt
    IDB-->>UI: Saved
    UI->>UI: Update syncStatus → "PENDING"
    UI-->>User: Show "Saved" indicator

    Note over UI,IDB: Every 5 minutes...
    UI->>IDB: Create FileVersion { content, versionNumber++ }
    IDB-->>UI: Version snapshot saved
```

---

## 5. Auto Sync When Internet Returns

```mermaid
sequenceDiagram
    participant Browser as Browser Event
    participant SE as Sync Engine
    participant IDB as IndexedDB
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    Browser->>SE: "online" event fired
    SE->>IDB: Query files WHERE syncStatus = "PENDING" or "LOCAL_ONLY"
    IDB-->>SE: [file1, file2, file3]

    loop For each pending file
        SE->>API: POST /api/sync/push { file }
        API->>DB: Upsert file record
        DB-->>API: Saved
        API-->>SE: 200 { syncedAt }
        SE->>IDB: Update syncStatus → "SYNCED", set syncedAt
        SE->>IDB: Create SyncLog { fileId, action: "UPDATE", status: "SUCCESS" }
    end

    SE->>SE: Pull cloud changes
    SE->>API: GET /api/sync/pull?since=lastSyncTimestamp
    API->>DB: Find files updated after timestamp
    DB-->>API: [cloudFile1, cloudFile2]
    API-->>SE: Updated files from cloud

    loop For each cloud-updated file
        SE->>IDB: Check if local version conflicts
        alt No conflict
            SE->>IDB: Update local file with cloud version
        else Conflict detected
            SE->>IDB: Mark syncStatus → "CONFLICT"
            SE-->>Browser: Notify user of conflict
        end
    end
```

---

## 6. Conflict Resolution

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant SE as Sync Engine
    participant IDB as IndexedDB
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    UI-->>User: Show conflict notification
    User->>UI: Open conflict resolver

    UI->>IDB: Get local version
    UI->>API: GET /api/files/:id (cloud version)
    API->>DB: Fetch file
    DB-->>API: Cloud file data
    API-->>UI: Cloud version content

    UI-->>User: Show side-by-side diff (Local vs Cloud)

    alt User chooses "Keep Local"
        User->>UI: Click "Keep Local"
        UI->>API: PUT /api/files/:id { content: localContent }
        API->>DB: Update file
        DB-->>API: Updated
        UI->>IDB: syncStatus → "SYNCED"
    else User chooses "Keep Cloud"
        User->>UI: Click "Keep Cloud"
        UI->>IDB: Update content with cloud version
        UI->>IDB: syncStatus → "SYNCED"
    else User chooses "Merge"
        User->>UI: Manually edit merged content
        UI->>IDB: Save merged content
        UI->>API: PUT /api/files/:id { content: mergedContent }
        API->>DB: Update
        UI->>IDB: syncStatus → "SYNCED"
    end

    UI->>IDB: Create SyncLog { action: "RESOLVE_CONFLICT", status: "SUCCESS" }
    UI-->>User: Conflict resolved
```

---

## 7. Offline App Loading (Service Worker)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant SW as Service Worker
    participant Cache as Browser Cache
    participant IDB as IndexedDB

    User->>Browser: Open SafarSetu Pro (no internet)
    Browser->>SW: Fetch request for app assets
    SW->>Cache: Check cache for assets
    Cache-->>SW: Cached HTML, CSS, JS
    SW-->>Browser: Serve cached assets
    Browser-->>User: App loads fully

    User->>Browser: Navigate to workspace
    Browser->>IDB: Load workspace data
    IDB-->>Browser: Files, folders, settings
    Browser-->>User: Workspace rendered with all files

    User->>Browser: Edit a file
    Browser->>IDB: Save changes locally
    IDB-->>Browser: Saved
    Browser-->>User: "Saved offline" indicator shown

    Note over User,IDB: Everything works without internet!
```

---

## 8. File Version Restore

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant IDB as IndexedDB

    User->>UI: Click "History" on a file
    UI->>IDB: Query FileVersions WHERE fileId = currentFile
    IDB-->>UI: [v1, v2, v3, v4]
    UI-->>User: Show version timeline with timestamps

    User->>UI: Click on Version 2 to preview
    UI-->>User: Show Version 2 content in read-only view

    User->>UI: Click "Restore this version"
    UI->>IDB: Update file.content = version2.content
    UI->>IDB: Create new FileVersion (v5 = restored v2)
    UI->>IDB: Set syncStatus → "PENDING"
    IDB-->>UI: Saved
    UI-->>User: File restored to Version 2
```

---

## 9. Workspace Management

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant IDB as IndexedDB
    participant API as Express Backend
    participant DB as MongoDB (Prisma)

    User->>UI: Click "New Workspace"
    UI-->>User: Show modal (enter workspace name)
    User->>UI: Enter "Travel Notes" → Click Create

    UI->>IDB: Store workspace { name: "Travel Notes", syncStatus: "LOCAL_ONLY" }
    IDB-->>UI: Created

    alt Online
        UI->>API: POST /api/workspaces { name: "Travel Notes" }
        API->>DB: Create Workspace
        DB-->>API: Created
        API-->>UI: 201 { workspace }
        UI->>IDB: Update syncStatus → "SYNCED"
    end

    UI-->>User: Workspace "Travel Notes" ready
    UI->>UI: Switch to new workspace, show empty file tree
```
