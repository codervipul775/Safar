import { PrismaClient } from "@prisma/client"
import { FileNode, FileType, SyncStatus, FileVersion } from "../models"

export interface CreateFileDTO {
  name: string
  type: FileType
  workspaceId: string
  parentId?: string | null
  content?: string
  language?: string | null
}

export interface UpdateFileDTO {
  name?: string
  content?: string
  syncStatus?: SyncStatus
}

export interface IFileService {
  create(data: CreateFileDTO): Promise<FileNode>
  update(id: string, data: UpdateFileDTO): Promise<FileNode>
  delete(id: string): Promise<void>
  findById(id: string): Promise<FileNode>
  getTree(workspaceId: string): Promise<FileNode[]>
  getVersions(fileId: string): Promise<FileVersion[]>
  restoreVersion(fileId: string, versionId: string): Promise<FileNode>
}

export class FileService implements IFileService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateFileDTO): Promise<FileNode> {
    const name = data.name?.trim()
    if (!name) throw new Error("File name is required")

    if (data.parentId) {
      const parent = await this.prisma.file.findUnique({ where: { id: data.parentId } })
      if (!parent) throw new Error("Parent folder not found")
      if (parent.type !== FileType.FOLDER) throw new Error("Parent must be a folder")
    }

    const existing = await this.prisma.file.findFirst({
      where: { name, workspaceId: data.workspaceId, parentId: data.parentId || null },
    })
    if (existing) throw new Error(`"${name}" already exists`)

    const fileId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    
    const file = await this.prisma.file.create({
      data: {
        id: fileId, // MANDATORY ID LOCK
        name,
        type: data.type,
        workspaceId: data.workspaceId,
        parentId: data.parentId || null,
        content: data.type === FileType.FOLDER ? null : data.content || "",
        language: data.language || null,
        syncStatus: SyncStatus.SYNCED,
      },
    })

    return FileNode.fromPrisma(file)
  }

  async update(id: string, data: UpdateFileDTO): Promise<FileNode> {
    const existing = await this.prisma.file.findUnique({ where: { id } })
    if (!existing) throw new Error("File not found")

    if (data.content !== undefined && existing.type !== FileType.FOLDER) {
      await this.createVersionSnapshot(id, existing.content || "");
    }

    const file = await this.prisma.file.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.syncStatus && { syncStatus: data.syncStatus }),
      },
    });

    return FileNode.fromPrisma(file)
  }

  async delete(id: string): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id } })
    if (!file) throw new Error("File not found")

    if (file.type === FileType.FOLDER) {
      await this.deleteRecursive(id);
    } else {
      await this.prisma.fileVersion.deleteMany({ where: { fileId: id } })
      await this.prisma.syncLog.deleteMany({ where: { fileId: id } })
      await this.prisma.file.delete({ where: { id } })
    }
  }

  async findById(id: string): Promise<FileNode> {
    const file = await this.prisma.file.findUnique({ where: { id } })
    if (!file) throw new Error("File not found")
    return FileNode.fromPrisma(file)
  }

  async getTree(workspaceId: string): Promise<FileNode[]> {
    const files = await this.prisma.file.findMany({
      where: { workspaceId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return this.buildTree(files.map(FileNode.fromPrisma))
  }

  async getVersions(fileId: string): Promise<FileVersion[]> {
    const versions = await this.prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { versionNumber: "desc" },
    });

    return versions.map(FileVersion.fromPrisma)
  }

  async restoreVersion(fileId: string, versionId: string): Promise<FileNode> {
    const version = await this.prisma.fileVersion.findUnique({ where: { id: versionId } })
    if (!version || version.fileId !== fileId) throw new Error("Version not found")

    const file = await this.prisma.file.findUnique({ where: { id: fileId } })
    if (!file) throw new Error("File not found")

    await this.createVersionSnapshot(fileId, file.content || "")

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: { content: version.content, syncStatus: SyncStatus.PENDING },
    })

    return FileNode.fromPrisma(updated)
  }

  private buildTree(nodes: FileNode[]): FileNode[] {
    const map = new Map<string, FileNode>()
    const roots: FileNode[] = []

    nodes.forEach((n) => map.set(n.id, n))

    for (const node of nodes) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.addChild(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  private async deleteRecursive(folderId: string): Promise<void> {
    const children = await this.prisma.file.findMany({ where: { parentId: folderId } })

    for (const child of children) {
      if (child.type === FileType.FOLDER) {
        await this.deleteRecursive(child.id)
      } else {
        await this.prisma.fileVersion.deleteMany({ where: { fileId: child.id } })
        await this.prisma.syncLog.deleteMany({ where: { fileId: child.id } })
        await this.prisma.file.delete({ where: { id: child.id } })
      }
    }

    await this.prisma.fileVersion.deleteMany({ where: { fileId: folderId } })
    await this.prisma.syncLog.deleteMany({ where: { fileId: folderId } })
    await this.prisma.file.delete({ where: { id: folderId } })
  }

  private async createVersionSnapshot(fileId: string, content: string): Promise<void> {
    const latest = await this.prisma.fileVersion.findFirst({
      where: { fileId },
      orderBy: { versionNumber: "desc" },
    })

    await this.prisma.fileVersion.create({
      data: {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fileId,
        content,
        versionNumber: (latest?.versionNumber || 0) + 1,
      },
    })
  }
}