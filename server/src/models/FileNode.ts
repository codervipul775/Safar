import { BaseEntity } from "./BaseEntity"

export enum FileType {
  TEXT = "TEXT",
  MARKDOWN = "MARKDOWN",
  CODE = "CODE",
  TODO = "TODO",
  FOLDER = "FOLDER",
}

export enum SyncStatus {
  SYNCED = "SYNCED",
  PENDING = "PENDING",
  CONFLICT = "CONFLICT",
  LOCAL_ONLY = "LOCAL_ONLY",
  FAILED = "FAILED",
}

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "java",
  "c",
  "cpp",
  "markdown",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class FileNode extends BaseEntity {
  private _name: string
  private _type: FileType
  private _content: string | null
  private _language: string | null
  private _parentId: string | null
  private _workspaceId: string
  private _syncStatus: SyncStatus
  private _syncedAt: Date | null
  private _children: FileNode[] = []

  constructor(
    id: string,
    name: string,
    type: FileType,
    workspaceId: string,
    content: string | null = "",
    language: string | null = null,
    parentId: string | null = null,
    syncStatus: SyncStatus = SyncStatus.LOCAL_ONLY,
    syncedAt: Date | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt)

    this._name = name
    this._type = type
    this._workspaceId = workspaceId
    this._parentId = parentId
    this._language = language
    this._syncStatus = syncStatus
    this._syncedAt = syncedAt
    this._content = type === FileType.FOLDER ? null : content ?? ""
  }

  get name() { 
    return this._name
}
  get type() {
    return this._type
}
  get content() {
    return this._content
}
  get language() {
    return this._language
}
  get parentId() {
    return this._parentId
}
  get workspaceId() {
    return this._workspaceId
}
  get syncStatus() {
    return this._syncStatus
}
  get syncedAt() {
    return this._syncedAt
}
  get children() {
    return [...this._children]
}

  set name(value: string) {
    const trimmed = value.trim()
    if (!trimmed) throw new Error("File name is required")
    if (trimmed.length > 255) throw new Error("File name too long")
    this._name = trimmed
    this.touch()
  }

  isFolder(): boolean {
    return this._type === FileType.FOLDER
  }

  addChild(node: FileNode): void {
    if (!this.isFolder()) throw new Error("Only folders can have children")
    if (this._children.some(c => c.id === node.id)) {
      throw new Error("Child already exists")
    }
    this._children.push(node)
  }

  removeChild(childId: string): void {
    if (!this.isFolder()) throw new Error("Not a folder")
    const index = this._children.findIndex(c => c.id === childId)
    if (index === -1) throw new Error("Child not found")
    this._children.splice(index, 1)
  }

  getDescendantCount(): number {
    return this._children.reduce((count, child) => {
      return count + 1 + (child.isFolder() ? child.getDescendantCount() : 0)
    }, 0)
  }

  updateContent(newContent: string): void {
    if (this.isFolder()) throw new Error("Folders have no content");
    this._content = newContent
    this._syncStatus = SyncStatus.PENDING
    this.touch()
  }

  setSyncStatus(status: SyncStatus): void {
    this._syncStatus = status
    if (status === SyncStatus.SYNCED) {
      this._syncedAt = new Date()
    }
    this.touch()
  }

  getExtension(): string | null {
    if (this.isFolder()) return null
    const parts = this._name.split(".")
    return parts.length > 1 ? parts.pop()!.toLowerCase() : null
  }

  validate(): void {
    if (!this._name.trim()) throw new Error("File name is required")
    if (!Object.values(FileType).includes(this._type))
      throw new Error("Invalid file type")
    if (!this._workspaceId) throw new Error("Workspace is required")
    if (!Object.values(SyncStatus).includes(this._syncStatus))
      throw new Error("Invalid sync status")

    if (this._type === FileType.CODE && this._language) {
      if (!SUPPORTED_LANGUAGES.includes(this._language as SupportedLanguage)) {
        console.warn(`Unsupported language: ${this._language}`)
      }
    }
  }


  static fromPrisma(data: {
    id: string
    name: string
    type: string
    content: string | null
    language: string | null
    parentId: string | null
    workspaceId: string
    syncStatus: string
    syncedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): FileNode {
    return new FileNode(
      data.id,
      data.name,
      data.type as FileType,
      data.workspaceId,
      data.content,
      data.language,
      data.parentId,
      data.syncStatus as SyncStatus,
      data.syncedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this._name,
      type: this._type,
      content: this._content,
      language: this._language,
      parentId: this._parentId,
      workspaceId: this._workspaceId,
      syncStatus: this._syncStatus,
      syncedAt: this._syncedAt?.toISOString() ?? null,
      isFolder: this.isFolder(),
      extension: this.getExtension(),
      childCount: this._children.length,
    }
  }
}