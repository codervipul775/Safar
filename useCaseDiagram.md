# Safar - Use Case Document

| **User** | A person who wants to write, code, or plan using Safar Studio |
| **System** | Safar application (frontend + backend) |
| **IndexedDB** | Browser-based local database for offline storage |
| **MongoDB Cloud** | Remote cloud database for persistent storage & sync |
| **Sync Engine** | Module that manages data synchronization between local and cloud |
| **Gemini API** | Google's AI model API for the built-in coding assistant |


## Use Case Diagram

```mermaid
graph LR
    User((User))

    %% ===== AUTHENTICATION MODULE =====
    subgraph AUTH ["Authentication"]
        direction TB
        UC1["Register Account"]
        UC2["Login"]
        UC1_1["Validate Email"]
        UC1_2["Hash Password"]
        UC2_1["Generate JWT Token"]
        UC2_2["Offline Guest Access"]

        UC1 --> UC1_1
        UC1 --> UC1_2
        UC2 --> UC2_1
        UC2 -.->|extend| UC2_2
    end

    %% ===== WORKSPACE MODULE =====
    subgraph WORKSPACE ["Workspace Management"]
        direction TB
        UC3["Create Workspace"]
        UC4["Create File / Folder"]
        UC5["Delete File / Folder"]
        UC6["Search Files"]
        UC4_1["Select File Type"]
        UC4_2["Set Parent Folder"]
        UC5_1["Recursive Delete Children"]

        UC4 --> UC4_1
        UC4 --> UC4_2
        UC5 -.->|include| UC5_1
    end

    %% ===== CODE EDITOR MODULE =====
    subgraph CODE_EDITOR ["Code Editing"]
        direction TB
        UC7["Edit Code File"]
        UC7_1["Auto-Save to IndexedDB"]
        UC7_2["Syntax Highlighting"]
        UC7_3["Bracket Matching"]
        UC7_4["Run Code in Browser"]
        UC7_5["View Console Output"]

        UC7 -.->|include| UC7_1
        UC7 --> UC7_2
        UC7 --> UC7_3
        UC7_4 --> UC7_5
    end

    %% ===== DOCUMENT EDITOR MODULE =====
    subgraph DOC_EDITOR ["Document Editing"]
        direction TB
        UC8["Edit Rich Document"]
        UC8_1["Format Text"]
        UC8_2["Insert Table"]
        UC8_3["Add Task List"]
        UC8_4["Export to PDF"]
        UC8_5["Auto-Save to IndexedDB"]

        UC8 --> UC8_1
        UC8 --> UC8_2
        UC8 --> UC8_3
        UC8 -.->|extend| UC8_4
        UC8 -.->|include| UC8_5
    end

    %% ===== VERSION HISTORY =====
    subgraph VERSIONS ["Version History"]
        direction TB
        UC9["View File Versions"]
        UC9_1["Restore Version"]

        UC9 -.->|extend| UC9_1
    end

    %% ===== AI ASSISTANT MODULE =====
    subgraph AI ["AI Assistant"]
        direction TB
        UC10["Chat with AI"]
        UC10_1["Configure API Key"]
        UC10_2["Fetch Available Models"]
        UC10_3["Send Code Context"]
        UC10_4["Apply Code Suggestion"]

        UC10 -.->|include| UC10_1
        UC10 --> UC10_3
        UC10 -.->|extend| UC10_4
        UC10_1 --> UC10_2
    end

    %% ===== SYNC MODULE =====
    subgraph SYNC ["Synchronization"]
        direction TB
        UC11["Sync Data to Cloud"]
        UC12["View Sync Status"]
        UC11_1["Push Local Changes"]
        UC11_2["Pull Cloud Changes"]
        UC11_3["Create Sync Log"]

        UC11 --> UC11_1
        UC11 --> UC11_2
        UC11 -.->|include| UC11_3
    end

    %% ===== PLATFORM MODULE =====
    subgraph PLATFORM ["Platform Features"]
        direction TB
        UC13["Work Offline"]
        UC14["Toggle Theme"]
        UC15["View Dashboard"]
        UC15_1["Select Workspace Mode"]
        UC13_1["Read/Write IndexedDB"]
        UC13_2["Queue Changes for Sync"]

        UC13 --> UC13_1
        UC13 --> UC13_2
        UC15 --> UC15_1
    end

    %% ===== USER CONNECTIONS =====
    User --> AUTH
    User --> WORKSPACE
    User --> CODE_EDITOR
    User --> DOC_EDITOR
    User --> VERSIONS
    User --> AI
    User --> SYNC
    User --> PLATFORM

    %% ===== EXTERNAL ACTORS =====
    SE((Sync Engine))
    Cloud[(MongoDB Cloud)]
    LocalDB[(IndexedDB)]
    GeminiAPI((Gemini API))

    %% ===== EXTERNAL ACTOR CONNECTIONS =====
    SE --> UC11
    UC11_1 --> Cloud
    UC11_2 --> Cloud
    UC7_1 --> LocalDB
    UC8_5 --> LocalDB
    UC13_1 --> LocalDB
    UC4 --> LocalDB
    UC5 --> LocalDB
    UC10 --> GeminiAPI
```

