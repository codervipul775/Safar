# Safar - ER Diagram 

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId id PK
        String email UK "unique"
        String name
        String passwordHash
        DateTime createdAt
        DateTime updatedAt
    }

    WORKSPACE {
        String id PK
        String name
        String description "nullable"
        String ownerId FK
        String ownerEmail "nullable, identity recovery"
        DateTime createdAt
        DateTime updatedAt
    }

    FILE {
        String id PK
        String name
        String type "TEXT, MARKDOWN, CODE, TODO, FOLDER, DOCUMENT"
        String content "nullable"
        String language "nullable"
        String parentId FK "nullable, self-referencing"
        String workspaceId FK
        String ownerId "nullable, identity lock"
        String ownerEmail "nullable, identity lock"
        String syncStatus "SYNCED, PENDING, CONFLICT, LOCAL_ONLY, FAILED"
        DateTime syncedAt "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    FILE_VERSION {
        String id PK
        String fileId FK
        String content
        Int versionNumber
        DateTime createdAt
    }

    SYNC_LOG {
        String id PK
        String fileId FK
        String action "CREATE, UPDATE, DELETE, RESOLVE_CONFLICT"
        String status "SUCCESS, FAILED, PARTIAL"
        String details "nullable"
        DateTime timestamp
    }

    USER ||--o{ WORKSPACE : "owns"
    WORKSPACE ||--o{ FILE : "contains"
    FILE ||--o{ FILE : "parent-child"
    FILE ||--o{ FILE_VERSION : "has versions"
    FILE ||--o{ SYNC_LOG : "has logs"
```
