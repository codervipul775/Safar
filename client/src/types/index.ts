export const FileType = {
  TEXT: "TEXT",
  MARKDOWN: "MARKDOWN",
  CODE: "CODE",
  TODO: "TODO",
  FOLDER: "FOLDER"
} as const

export type FileType = typeof FileType[keyof typeof FileType]

export const SyncStatus = {
  SYNCED: "SYNCED",
  PENDING: "PENDING",
  CONFLICT: "CONFLICT",
  LOCAL_ONLY: "LOCAL_ONLY",
  FAILED: "FAILED"
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]


export interface FileTreeNode {
  id: string
  name: string
  type: FileType
  language: string | null
  parentId: string | null
  workspaceId: string
  syncStatus: SyncStatus
  children: FileTreeNode[]
  isExpanded?: boolean
}

export interface OpenTab {
  id: string
  name: string
  type: FileType
  language: string | null
  isModified: boolean
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

export interface AppState {
  activeWorkspace: Workspace | null
  workspaces: Workspace[]
  fileTree: FileTreeNode[]
  activeFileId: string | null
  openTabs: OpenTab[]
  activeTabId: string | null
  isOnline: boolean
  pendingChanges: number
  sidebarOpen: boolean
  isMobile: boolean
}

export const LANGUAGE_MAP: Record<string,string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  java: "java",
  c: "c",
  cpp: "cpp"
}

export const FILE_TYPE_ICONS: Record<FileType,string> = {
  [FileType.FOLDER]: "Folder",
  [FileType.MARKDOWN]: "FileText",
  [FileType.CODE]: "FileCode",
  [FileType.TEXT]: "File",
  [FileType.TODO]: "CheckSquare"
}

export function getLanguageFromFilename(filename:string):string | null{
  const ext = filename.split(".").pop()?.toLowerCase()
  if(!ext) return null
  return LANGUAGE_MAP[ext] || null
}

export function getFileTypeFromFilename(filename:string):FileType{
  const ext = filename.split(".").pop()?.toLowerCase()
  if(!ext) return FileType.TEXT
  if(ext==="md"||ext==="markdown") return FileType.MARKDOWN
  if(ext==="todo") return FileType.TODO
  if(Object.keys(LANGUAGE_MAP).includes(ext)) return FileType.CODE
  return FileType.TEXT
}