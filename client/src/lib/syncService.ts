import { api } from "./api"
import { getFile, getFilesByWorkspace, saveFile, getAllWorkspaces, saveWorkspace } from "./db"
import { SyncStatus } from "../types"

export class SyncService {
  private static isSyncing = false

  static async pushWorkspaces() {
    const token = localStorage.getItem("safar_token")
    if (!token) return

    try {
      const workspaces = await getAllWorkspaces()
      const localOnly = workspaces.filter(ws => ws.syncStatus === SyncStatus.LOCAL_ONLY)

      if (localOnly.length > 0) {
        console.log(`Sync: Pushing ${localOnly.length} workspaces...`)
        const res = await api.post("/sync/workspaces", { workspaces: localOnly })
        
        for (const ws of localOnly) {
           await saveWorkspace({
             ...ws,
             syncStatus: SyncStatus.SYNCED
           })
        }
        console.log("Sync: Workspaces result", res.data)
      }
    } catch (err) {
      console.error("Sync: Workspace push failed", err)
    }
  }

  static async pushChanges(): Promise<number> {
    if (this.isSyncing) return 0
    const token = localStorage.getItem("safar_token")
    if (!token) return 0

    this.isSyncing = true
    let syncedCount = 0
    
    try {
      await this.pushWorkspaces() // Ensure workspaces are synced first

      const workspaces = await getAllWorkspaces()
      const allChanges: any[] = []

      for (const ws of workspaces) {
        const files = await getFilesByWorkspace(ws.id)
        const pending = files.filter(f => f.syncStatus === SyncStatus.PENDING || f.syncStatus === SyncStatus.LOCAL_ONLY)
        
        pending.forEach(f => {
          allChanges.push({
            fileId: f.id,
            name: f.name,
            type: f.type,
            content: f.content || "",
            parentId: f.parentId,
            workspaceId: f.workspaceId,
            updatedAt: f.updatedAt
          })
        })
      }

      if (allChanges.length === 0) {
        this.isSyncing = false
        return 0
      }

      console.log(`Sync: Pushing ${allChanges.length} changes...`)
      const res = await api.post("/sync/push", { changes: allChanges })
      console.log("Sync: Push result", res.data)

      for (const change of allChanges) {
         const local = await getFile(change.fileId)
         if (local) {
           await saveFile({
             ...local,
             syncStatus: SyncStatus.SYNCED,
             syncedAt: new Date().toISOString()
           })
           syncedCount++
         }
      }

      return syncedCount

    } catch (err) {
      console.error("Sync: Push failed", err)
      return 0
    } finally {
      this.isSyncing = false
    }
  }

  static async pullChanges(activeWorkspaceId: string | null) {
    if (!activeWorkspaceId) return
    const token = localStorage.getItem("safar_token")
    if (!token) return

    try {
      const lastSync = localStorage.getItem(`last_sync_${activeWorkspaceId}`) || new Date(0).toISOString()
      
      const res = await api.get(`/sync/pull?workspaceId=${activeWorkspaceId}&since=${lastSync}`)
      const remoteFiles = res.data.files

      if (remoteFiles.length > 0) {
        console.log(`Sync: Pulling ${remoteFiles.length} files...`)
        for (const rf of remoteFiles) {
           await saveFile({
             ...rf,
             syncStatus: SyncStatus.SYNCED,
             syncedAt: new Date().toISOString()
           })
        }
        localStorage.setItem(`last_sync_${activeWorkspaceId}`, new Date().toISOString())
        return true
      }
    } catch (err) {
      console.error("Sync: Pull failed", err)
    }
    return false
  }
}
