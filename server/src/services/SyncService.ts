import { PrismaClient } from "@prisma/client"
import { FileNode, SyncStatus, SyncLog, SyncAction, SyncLogStatus } from "../models"

export interface SyncPushDTO {
  fileId: string
  name: string
  type: string
  content: string
  parentId: string | null
  workspaceId: string
  updatedAt: string
}

export interface SyncWorkspaceDTO {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
  results: { fileId: string; status: 'SUCCESS' | 'FAILED' | 'CONFLICT' }[]
}

export interface SyncStatusInfo {
  isOnline: boolean
  pendingChanges: number
  lastSyncedAt: Date | null
}

export interface ISyncService {
  pushWorkspaces(userId: string, userEmail: string, workspaces: SyncWorkspaceDTO[]): Promise<number>
  pushChanges(userId: string, userEmail: string, changes: SyncPushDTO[]): Promise<SyncResult>
  pullChanges(workspaceId: string, since: Date): Promise<FileNode[]>
  resolveConflict(fileId: string, resolution: "local" | "cloud", localContent?: string): Promise<FileNode>
  getStatus(workspaceId: string): Promise<SyncStatusInfo>
}

export class SyncService implements ISyncService {
  constructor(private prisma: PrismaClient) {}

  async pushWorkspaces(userId: string, userEmail: string, workspaces: SyncWorkspaceDTO[]): Promise<number> {
    let synced = 0
    for (const ws of workspaces) {
      await this.prisma.workspace.upsert({
        where: { id: ws.id },
        update: {
          name: ws.name,
          ownerId: userId,
          ownerEmail: userEmail, // SYNC IDENTITY LOCK
          updatedAt: new Date(ws.updatedAt)
        },
        create: {
          id: ws.id,
          name: ws.name,
          ownerId: userId,
          ownerEmail: userEmail, // SYNC IDENTITY LOCK
          createdAt: new Date(ws.createdAt),
          updatedAt: new Date(ws.updatedAt)
        }
      })
      synced++
    }
    return synced
  }

  async pushChanges(userId: string, userEmail: string, changes: SyncPushDTO[]): Promise<SyncResult> {
    let pushed = 0
    let conflicts = 0
    const results: { fileId: string; status: 'SUCCESS' | 'FAILED' | 'CONFLICT' }[] = []

    for (const change of changes) {
      try {
        const existing = await this.prisma.file.findUnique({
          where: { id: change.fileId }
        })

        if (existing) {
          const clientTime = new Date(change.updatedAt)
          const conflict = existing.updatedAt > clientTime && existing.content !== change.content

          if (conflict) {
            await this.prisma.file.update({
              where: { id: change.fileId },
              data: { syncStatus: SyncStatus.CONFLICT }
            })

            await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.FAILED, "Conflict detected")
            conflicts++
            results.push({ fileId: change.fileId, status: 'CONFLICT' })
            continue
          }

          // Versioning: If content changed, create a snapshot of the current cloud state before updating
          if (existing.content !== change.content) {
            const latestVersion = await this.prisma.fileVersion.findFirst({
              where: { fileId: change.fileId },
              orderBy: { versionNumber: "desc" }
            });
            
            await this.prisma.fileVersion.create({
              data: {
                 id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                 fileId: change.fileId,
                 content: existing.content || "",
                 versionNumber: (latestVersion?.versionNumber || 0) + 1,
                 createdAt: existing.updatedAt
              }
            });
          }
        }

        console.log(`Sync: Upserting file ${change.fileId} (${change.name}) for user ${userEmail}...`)
        await this.prisma.file.upsert({
          where: { id: change.fileId },
          update: {
            name: change.name,
            content: change.content,
            ownerId: userId,        // IDENTITY LOCK
            ownerEmail: userEmail,  // IDENTITY LOCK
            syncStatus: SyncStatus.SYNCED,
            syncedAt: new Date(),
            updatedAt: new Date(change.updatedAt)
          },
          create: {
            id: change.fileId,
            name: change.name,
            type: change.type,
            content: change.content,
            parentId: change.parentId,
            workspaceId: change.workspaceId,
            ownerId: userId,        // IDENTITY LOCK
            ownerEmail: userEmail,  // IDENTITY LOCK
            syncStatus: SyncStatus.SYNCED,
            syncedAt: new Date(),
            createdAt: new Date(change.updatedAt),
            updatedAt: new Date(change.updatedAt)
          }
        })

        await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.SUCCESS)
        pushed++
        results.push({ fileId: change.fileId, status: 'SUCCESS' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        await this.createLog(change.fileId, SyncAction.UPDATE, SyncLogStatus.FAILED, msg)
        console.error(`Sync error for ${change.fileId}:`, err)
        results.push({ fileId: change.fileId, status: 'FAILED' })
      }
    }

    return { pushed, pulled: 0, conflicts, results }
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

  async pullFull(userId: string, userEmail?: string): Promise<{ workspaces: any[], files: any[] }> {
    // Stage 1: Official Ownership Search
    let workspaces = await this.prisma.workspace.findMany({
      where: { ownerId: userId }
    })

    // Stage 2: Legacy Migration (Identity Recovery via Email)
    if (workspaces.length === 0 && userEmail) {
      console.log(`Sync: No files found for ID ${userId}, seeking legacy recovery by email: ${userEmail}...`)
      workspaces = await this.prisma.workspace.findMany({
          where: { ownerEmail: userEmail }
      })
      
      // If found by email, update the ownerId to the current userId
      if (workspaces.length > 0) {
        console.log(`Sync: Reclaiming ${workspaces.length} legacy workspaces for user ${userId}.`)
        for (const ws of workspaces) {
            await this.prisma.workspace.update({
                where: { id: ws.id },
                data: { 
                    ownerId: userId,
                    ownerEmail: userEmail 
                }
            })
        }
      }
    }

    const workspaceIds = workspaces.map((w: any) => w.id)
    let files = await this.prisma.file.findMany({
      where: { 
        workspaceId: { in: workspaceIds },
        syncStatus: SyncStatus.SYNCED
      }
    })

    // Stage 3: Direct file recovery — files exist but workspaces were never pushed
    if (files.length === 0) {
      console.log(`Sync: No files via workspaces. Trying direct ownerId lookup...`)
      const directFiles = await this.prisma.file.findMany({
        where: { 
          OR: [
            { ownerId: userId },
            ...(userEmail ? [{ ownerEmail: userEmail }] : [])
          ]
        }
      })

      if (directFiles.length > 0) {
        console.log(`Sync: Found ${directFiles.length} orphaned files. Auto-creating workspace records...`)
        files = directFiles

        // Auto-create missing workspace records so future pulls work normally
        const missingWsIds = [...new Set(directFiles.map((f: any) => f.workspaceId))]
        for (const wsId of missingWsIds) {
          const exists = await this.prisma.workspace.findUnique({ where: { id: wsId } })
          if (!exists) {
            await this.prisma.workspace.create({
              data: {
                id: wsId,
                name: "Recovered Studio",
                ownerId: userId,
                ownerEmail: userEmail || null,
              }
            })
            workspaces.push({ id: wsId, name: "Recovered Studio", description: null, ownerId: userId, ownerEmail: userEmail || null, createdAt: new Date(), updatedAt: new Date() })
          }
        }
      }
    }

    return {
      workspaces,
      files: files.map((f: any) => FileNode.fromPrisma(f).toJSON())
    }
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
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // IDENTITY LOCK
        fileId,
        action,
        status,
        details: details || null
      }
    })
  }
}