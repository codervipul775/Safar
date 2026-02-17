# Safar - Use Case Document

| **User** | A person who wants to write, code, or plan while traveling offline |
| **System** | SafarSetu Pro application (frontend + backend) |
| **IndexedDB** | Browser-based local database for offline storage |
| **MongoDB Cloud** | Remote cloud database for persistent storage & sync |
| **Service Worker** | Background process for caching and offline support |
| **Sync Engine** | Module that manages data synchronization between local and cloud |


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
    subgraph WORKSPACE [" Workspace Management"]
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

    %% ===== EDITOR MODULE =====
    subgraph EDITOR ["File Editing"]
        direction TB
        UC7["Edit Text File"]
        UC8["Edit Code File"]
        UC9["Edit Markdown File"]
        UC10["Manage Todo List"]
        UC11["View File Versions"]
        UC7_1["Auto-Save to IndexedDB"]
        UC8_1["Syntax Highlighting"]
        UC8_2["Bracket Matching"]
        UC9_1["Live Markdown Preview"]
        UC10_1["Check / Uncheck Items"]
        UC10_2["Reorder Items"]
        UC11_1["Preview Old Version"]
        UC11_2["Restore Version"]

        UC7 -.->|include| UC7_1
        UC8 --> UC8_1
        UC8 --> UC8_2
        UC8 -.->|include| UC7_1
        UC9 --> UC9_1
        UC9 -.->|include| UC7_1
        UC10 --> UC10_1
        UC10 --> UC10_2
        UC10 -.->|include| UC7_1
        UC11 --> UC11_1
        UC11 -.->|extend| UC11_2
    end

    %% ===== SYNC MODULE =====
    subgraph SYNC ["Synchronization"]
        direction TB
        UC12["Sync Data to Cloud"]
        UC13["Resolve Conflicts"]
        UC14["View Sync Status"]
        UC12_1["Push Local Changes"]
        UC12_2["Pull Cloud Changes"]
        UC12_3["Create Sync Log"]
        UC13_1["Show Side-by-Side Diff"]
        UC13_2["Keep Local Version"]
        UC13_3["Keep Cloud Version"]
        UC13_4["Manual Merge"]
        UC14_1["Show Pending Count"]
        UC14_2["Show Last Sync Time"]

        UC12 --> UC12_1
        UC12 --> UC12_2
        UC12 -.->|include| UC12_3
        UC13 --> UC13_1
        UC13 --> UC13_2
        UC13 --> UC13_3
        UC13 -.->|extend| UC13_4
        UC14 --> UC14_1
        UC14 --> UC14_2
    end

    %% ===== PLATFORM MODULE =====
    subgraph PLATFORM ["Platform Features"]
        direction TB
        UC15["Work Offline"]
        UC16["Install as PWA"]
        UC15_1["Cache App Assets"]
        UC15_2["Read/Write IndexedDB"]
        UC15_3["Queue Changes for Sync"]
        UC16_1["Add to Home Screen"]
        UC16_2["Run as Standalone App"]

        UC15 --> UC15_1
        UC15 --> UC15_2
        UC15 --> UC15_3
        UC16 --> UC16_1
        UC16 --> UC16_2
    end

    %% ===== USER CONNECTIONS (by module) =====
    User --> AUTH
    User --> WORKSPACE
    User --> EDITOR
    User --> SYNC
    User --> PLATFORM

    %% ===== EXTERNAL ACTORS =====
    SW(( Service Worker))
    SE((Sync Engine))
    Cloud[(MongoDB Cloud)]
    LocalDB[(IndexedDB)]

    %% ===== EXTERNAL ACTOR CONNECTIONS =====
    SW --> UC15_1
    SE --> UC12
    UC12_1 --> Cloud
    UC12_2 --> Cloud
    UC13 --> Cloud
    UC7_1 --> LocalDB
    UC15_2 --> LocalDB
    UC4 --> LocalDB
    UC5 --> LocalDB
```

