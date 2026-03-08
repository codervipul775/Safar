// services/index.ts

export { AuthService } from "./AuthService"
export type { RegisterDTO, LoginDTO, AuthResult, IAuthService } from "./AuthService"

export { WorkspaceService } from "./WorkspaceService"
export type { CreateWorkspaceDTO, IWorkspaceService } from "./WorkspaceService"

export { FileService } from "./FileService"
export type { CreateFileDTO, UpdateFileDTO, IFileService } from "./FileService"

export { SyncService } from "./SyncService"
export type { SyncPushDTO, SyncResult, SyncStatusInfo, ISyncService } from "./SyncService"