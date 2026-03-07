import { PrismaClient } from "@prisma/client"
import { FileNode, SyncStatus, SyncLog, SyncAction, SyncLogStatus } from "../models"

export interface SyncPushDTO {
  fileId: string
  content: string
  updatedAt: string
}

export interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
}

export interface SyncStatusInfo {
  isOnline: boolean
  pendingChanges: number
  lastSyncedAt: Date | null
}

export interface ISyncService {
  pushChanges(userId: string, changes: SyncPushDTO[]): Promise<SyncResult>
  pullChanges(workspaceId: string, since: Date): Promise<FileNode[]>
  resolveConflict(fileId: string, resolution: "local" | "cloud", localContent?: string): Promise<FileNode>
  getStatus(workspaceId: string): Promise<SyncStatusInfo>
}

export class SyncService implements ISyncService {
  constructor(private prisma: PrismaClient) {}

  async pushChanges(userId: string, changes: SyncPushDTO[]): Promise<SyncResult> {
    let pushed = 0
    let conflicts = 0

    for (const change of changes) {
      try {
        const file = await this.prisma.file.findUnique({
          where: { id: change.fileId }
        })

        if (!file) {
          await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.FAILED, "File not found")
          continue
        }

        const clientTime = new Date(change.updatedAt)
        const conflict = file.updatedAt > clientTime && file.content !== change.content

        if (conflict) {
          await this.prisma.file.update({
            where: { id: change.fileId },
            data: { syncStatus: SyncStatus.CONFLICT }
          })

          await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.FAILED, "Conflict detected")
          conflicts++
          continue
        }

        await this.prisma.file.update({
          where: { id: change.fileId },
          data: {
            content: change.content,
            syncStatus: SyncStatus.SYNCED,
            syncedAt: new Date()
          }
        })

        await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.SUCCESS)
        pushed++
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.FAILED, msg)
      }
    }

    return { pushed, pulled: 0, conflicts }
  }

  async pullChanges(workspaceId: string, since: Date): Promise<FileNode[]> {
    const files = await this.prisma.file.findMany({
      where: {
        workspaceId,
        updatedAt: { gt: since },
        syncStatus: SyncStatus.SYNCED
      },
      orderBy: { updatedAt: "desc" }
    })

    return files.map(FileNode.fromPrisma)
  }

  async resolveConflict(
    fileId: string,
    resolution: "local" | "cloud",
    localContent?: string
  ): Promise<FileNode> {

    const file = await this.prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) throw new Error("File not found")
    if (file.syncStatus !== SyncStatus.CONFLICT) throw new Error("No conflict")

    const content =
      resolution === "local"
        ? localContent ?? (() => { throw new Error("Local content required") })()
        : file.content || ""

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        content,
        syncStatus: SyncStatus.SYNCED,
        syncedAt: new Date()
      }
    })

    await this.createLog(
      fileId,
      SyncAction.RESOLVE_CONFLICT,
      SyncLogStatus.SUCCESS,
      `Resolved using ${resolution}`
    )

    return FileNode.fromPrisma(updated)
  }

  async getStatus(workspaceId: string): Promise<SyncStatusInfo> {
    const pendingChanges = await this.prisma.file.count({
      where: {
        workspaceId,
        syncStatus: {
          in: [SyncStatus.PENDING, SyncStatus.LOCAL_ONLY, SyncStatus.CONFLICT]
        }
      }
    })

    const lastSync = await this.prisma.file.findFirst({
      where: {
        workspaceId,
        syncedAt: { not: null }
      },
      orderBy: { syncedAt: "desc" },
      select: { syncedAt: true }
    })

    return {
      isOnline: true,
      pendingChanges,
      lastSyncedAt: lastSync?.syncedAt || null
    }
  }

  async getLogs(fileId: string, limit = 20): Promise<SyncLog[]> {
    const logs = await this.prisma.syncLog.findMany({
      where: { fileId },
      orderBy: { timestamp: "desc" },
      take: limit
    })

    return logs.map(SyncLog.fromPrisma)
  }

  private async createLog(
    fileId: string,
    action: SyncAction,
    status: SyncLogStatus,
    details?: string
  ) {
    await this.prisma.syncLog.create({
      data: {
        fileId,
        action,
        status,
        details: details || null
      }
    })
  }
}