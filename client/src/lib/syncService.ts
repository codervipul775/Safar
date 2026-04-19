import { api } from "./api"
import { saveFile, getAllWorkspaces, saveWorkspace, getFilesByWorkspace } from "./db"
import { SyncStatus } from "../types"

export class SyncService {
  private static isSyncing = false

  static async pushWorkspaces() {
    const token = localStorage.getItem("safar_token")
    if (!token) return

    try {
      const workspaces = await getAllWorkspaces()
      const needsSync = workspaces.filter((ws: any) => ws.syncStatus === SyncStatus.LOCAL_ONLY || ws.syncStatus === SyncStatus.PENDING)

      if (needsSync.length > 0) {
        console.log(`Sync: Pushing ${needsSync.length} workspaces...`)
        const res = await api.post("/sync/workspaces", { workspaces: needsSync })
        
        for (const ws of needsSync) {
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

  /**
   * Pulls data from the cloud.
   * If workspaceId is provided, it pulls updates for that workspace.
   * If no workspaceId is provided, it pulls ALL user content (Full Recovery).
   */
  static async pullChanges(workspaceId: string | null = null) {
    const token = localStorage.getItem("safar_token")
    if (!token) return false

    try {
      if (!workspaceId) {
        // FULL RECOVERY MODE (Cache-busted)
        console.log("Sync: Performing full cloud recovery...")
        const { data } = await api.get(`/sync/pull?t=${Date.now()}`)
        const { workspaces, files } = data

        for (const ws of workspaces) {
          await saveWorkspace({ ...ws, syncStatus: SyncStatus.SYNCED })
        }
        for (const f of files) {
          await saveFile({ ...f, syncStatus: SyncStatus.SYNCED })
        }
        console.log(`Sync: Recovered ${workspaces.length} workspaces and ${files.length} files.`)
        return true
      } else {
        // INCREMENTAL UPDATE MODE
        const lastSync = localStorage.getItem(`last_sync_${workspaceId}`) || new Date(0).toISOString()
        const res = await api.get(`/sync/pull?workspaceId=${workspaceId}&since=${lastSync}`)
        const remoteFiles = res.data.files

        if (remoteFiles.length > 0) {
          console.log(`Sync: Pulling ${remoteFiles.length} file updates...`)
          for (const rf of remoteFiles) {
             await saveFile({
               ...rf,
               syncStatus: SyncStatus.SYNCED,
               syncedAt: new Date().toISOString()
             })
          }
          localStorage.setItem(`last_sync_${workspaceId}`, new Date().toISOString())
          return true
        }
      }
    } catch (err) {
      console.error("Sync: Pull failed", err)
    }
    return false
  }

  static async pushChanges(force: boolean = false): Promise<number> {
    if (this.isSyncing && !force) return 0
    const token = localStorage.getItem("safar_token")
    if (!token) return 0

    this.isSyncing = true
    let syncedCount = 0
    
    try {
      await this.pushWorkspaces()

      const workspaces = await getAllWorkspaces()
      const allChanges: any[] = []

      for (const ws of workspaces) {
        const files = await getFilesByWorkspace(ws.id)
        const pending = files.filter((f: any) => f.syncStatus === SyncStatus.PENDING || f.syncStatus === SyncStatus.LOCAL_ONLY)
        
        pending.forEach((f: any) => {
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

      if (allChanges.length > 0) {
        console.log(`Sync: Found ${allChanges.length} local changes to push:`, allChanges)
        const res = await api.post("/sync/push", { changes: allChanges })
        const results = res.data.results || []
        console.log(`Sync: Server responded with results for ${results.length} files.`)
        for (const r of results) {
          if (r.status === 'SUCCESS' || r.status === 'CONFLICT') {
            const f = await getFile(r.fileId)
            if (f) {
              await saveFile({
                ...f,
                syncStatus: r.status === 'CONFLICT' ? SyncStatus.CONFLICT : SyncStatus.SYNCED,
                syncedAt: new Date().toISOString()
              })
              console.log(`Sync: Marked ${f.name} as SYNCED.`)
              syncedCount++
            }
          }
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
}

// Internal helper for pushChanges
async function getFile(id: string) {
    const { getFile: gf } = await import("./db");
    return gf(id);
}
