
# Safar - Class Diagram

## Complete Class Diagram

```mermaid
classDiagram
    direction TB

    class FileType {
       
        TEXT
        MARKDOWN
        CODE
        TODO
        FOLDER
    }

    class SyncStatus {
        
        SYNCED
        PENDING
        CONFLICT
        LOCAL_ONLY
        FAILED
    }

    class SyncAction {
        
        CREATE
        UPDATE
        DELETE
        RESOLVE_CONFLICT
    }

    %% ===== INTERFACES =====
    class IFileService {
        <<interface>>
        +create(data: CreateFileDTO) Promise~FileNode~
        +update(id: string, data: UpdateFileDTO) Promise~FileNode~
        +delete(id: string) Promise~void~
        +findById(id: string) Promise~FileNode~
        +getTree(workspaceId: string) Promise~FileNode[]~
        +getVersions(fileId: string) Promise~FileVersion[]~
        +restoreVersion(fileId: string, versionId: string) Promise~FileNode~
    }

    class ISyncService {
        <<interface>>
        +queueChange(fileId: string, action: SyncAction) Promise~void~
        +pushChanges() Promise~SyncResult~
        +pullChanges(since: Date) Promise~FileNode[]~
        +resolveConflict(fileId: string, resolution: string) Promise~void~
        +getStatus() SyncStatusInfo
    }

    class IWorkspaceService {
        <<interface>>
        +create(data: CreateWorkspaceDTO) Promise~Workspace~
        +getAll(userId: string) Promise~Workspace[]~
        +delete(id: string) Promise~void~
    }

    class IAuthService {
        <<interface>>
        +register(data: RegisterDTO) Promise~AuthResult~
        +login(data: LoginDTO) Promise~AuthResult~
        +verifyToken(token: string) Promise~User~
    }

    %% ===== BASE CLASS =====
    class BaseEntity {
        <<abstract>>
        #id: string
        #createdAt: Date
        #updatedAt: Date
        +getId() string
        +getCreatedAt() Date
        +getUpdatedAt() Date
        +toJSON() object
        #validate() void*
    }

    %% ===== MODEL CLASSES =====
    class User {
        -email: string
        -name: string
        -passwordHash: string
        -workspaces: Workspace[]
        +getEmail() string
        +getName() string
        +getWorkspaces() Workspace[]
        +createWorkspace(name: string) Workspace
        +toJSON() object
        #validate() void
    }

    class Workspace {
        -name: string
        -ownerId: string
        -files: FileNode[]
        +getName() string
        +getOwnerId() string
        +getFiles() FileNode[]
        +getFileTree() FileNode[]
        +addFile(file: FileNode) void
        +removeFile(fileId: string) void
        +toJSON() object
        #validate() void
    }

    class FileNode {
        -name: string
        -type: FileType
        -content: string
        -language: string
        -parentId: string
        -workspaceId: string
        -syncStatus: SyncStatus
        -syncedAt: Date
        -versions: FileVersion[]
        -children: FileNode[]
        +getName() string
        +getType() FileType
        +getContent() string
        +getLanguage() string
        +getSyncStatus() SyncStatus
        +getChildren() FileNode[]
        +isFolder() boolean
        +updateContent(content: string) void
        +setSyncStatus(status: SyncStatus) void
        +createVersion() FileVersion
        +getVersionHistory() FileVersion[]
        +addChild(node: FileNode) void
        +toJSON() object
        #validate() void
    }

    class FileVersion {
        -fileId: string
        -content: string
        -versionNumber: number
        +getFileId() string
        +getContent() string
        +getVersionNumber() number
        +toJSON() object
        #validate() void
    }

    class SyncLog {
        -fileId: string
        -action: SyncAction
        -status: string
        -details: string
        +getFileId() string
        +getAction() SyncAction
        +getStatus() string
        +markSuccess() void
        +markFailed(error: string) void
        +toJSON() object
        #validate() void
    }

    %% ===== SERVICE CLASSES =====
    class FileService {
        -prisma: PrismaClient
        +create(data: CreateFileDTO) Promise~FileNode~
        +update(id: string, data: UpdateFileDTO) Promise~FileNode~
        +delete(id: string) Promise~void~
        +findById(id: string) Promise~FileNode~
        +getTree(workspaceId: string) Promise~FileNode[]~
        +getVersions(fileId: string) Promise~FileVersion[]~
        +restoreVersion(fileId: string, versionId: string) Promise~FileNode~
        -buildTree(files: FileNode[]) FileNode[]
        -deleteRecursive(id: string) Promise~void~
    }

    class SyncService {
        -prisma: PrismaClient
        -fileService: FileService
        +queueChange(fileId: string, action: SyncAction) Promise~void~
        +pushChanges() Promise~SyncResult~
        +pullChanges(since: Date) Promise~FileNode[]~
        +resolveConflict(fileId: string, resolution: string) Promise~void~
        +getStatus() SyncStatusInfo
        -detectConflicts(local: FileNode, cloud: FileNode) boolean
        -createSyncLog(fileId: string, action: SyncAction) Promise~void~
    }

    class WorkspaceService {
        -prisma: PrismaClient
        +create(data: CreateWorkspaceDTO) Promise~Workspace~
        +getAll(userId: string) Promise~Workspace[]~
        +delete(id: string) Promise~void~
        +findById(id: string) Promise~Workspace~
    }

    class AuthService {
        -prisma: PrismaClient
        -jwtSecret: string
        +register(data: RegisterDTO) Promise~AuthResult~
        +login(data: LoginDTO) Promise~AuthResult~
        +verifyToken(token: string) Promise~User~
        -hashPassword(password: string) Promise~string~
        -comparePassword(password: string, hash: string) Promise~boolean~
        -generateToken(userId: string) string
    }

    %% ===== CONTROLLER CLASSES =====
    class FileController {
        -fileService: FileService
        +createFile(req: Request, res: Response) void
        +updateFile(req: Request, res: Response) void
        +deleteFile(req: Request, res: Response) void
        +getFile(req: Request, res: Response) void
        +getFileTree(req: Request, res: Response) void
        +getVersions(req: Request, res: Response) void
        +restoreVersion(req: Request, res: Response) void
    }

    class SyncController {
        -syncService: SyncService
        +pushChanges(req: Request, res: Response) void
        +pullChanges(req: Request, res: Response) void
        +getStatus(req: Request, res: Response) void
        +resolveConflict(req: Request, res: Response) void
    }

    class WorkspaceController {
        -workspaceService: WorkspaceService
        +create(req: Request, res: Response) void
        +getAll(req: Request, res: Response) void
        +delete(req: Request, res: Response) void
    }

    class AuthController {
        -authService: AuthService
        +register(req: Request, res: Response) void
        +login(req: Request, res: Response) void
        +getProfile(req: Request, res: Response) void
    }

    %% ===== FRONTEND CLASSES =====
    class LocalDatabase {
        -dbName: string
        -version: number
        -db: IDBDatabase
        +init() Promise~void~
        +getAll(store: string) Promise~any[]~
        +getById(store: string, id: string) Promise~any~
        +put(store: string, data: any) Promise~void~
        +delete(store: string, id: string) Promise~void~
        +query(store: string, index: string, value: any) Promise~any[]~
    }

    class ClientSyncEngine {
        -localDb: LocalDatabase
        -apiBaseUrl: string
        -isOnline: boolean
        -syncInterval: number
        +init() void
        +onOnline() void
        +onOffline() void
        +pushPendingChanges() Promise~void~
        +pullCloudChanges() Promise~void~
        +getPendingCount() Promise~number~
        +getLastSyncTime() Date
        -startListening() void
        -scheduleSyncCheck() void
    }

    %% ===== INHERITANCE =====
    BaseEntity <|-- User
    BaseEntity <|-- Workspace
    BaseEntity <|-- FileNode
    BaseEntity <|-- FileVersion
    BaseEntity <|-- SyncLog

    %% ===== INTERFACE IMPLEMENTATIONS =====
    IFileService <|.. FileService
    ISyncService <|.. SyncService
    IWorkspaceService <|.. WorkspaceService
    IAuthService <|.. AuthService

    %% ===== RELATIONSHIPS =====
    User "1" --> "*" Workspace 
    Workspace "1" --> "*" FileNode 
    FileNode "1" --> "*" FileVersion 
    FileNode "1" --> "*" SyncLog 
    FileNode "1" --> "*" FileNode 
    FileNode --> FileType 
    FileNode --> SyncStatus 
    SyncLog --> SyncAction 

    %% ===== DEPENDENCIES =====
    FileController --> FileService
    SyncController --> SyncService 
    WorkspaceController --> WorkspaceService 
    AuthController --> AuthService 
    SyncService --> FileService 
    ClientSyncEngine --> LocalDatabase 
```