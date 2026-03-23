import { Response } from "express"
import { SyncService } from "../services"
import { AuthRequest } from "../middleware/authMiddleware"

export class SyncController {
  constructor(private syncService: SyncService) {}

  pushWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user)
        return void res.status(401).json({ error: "Not authenticated" })

      const { workspaces } = req.body
      if (!Array.isArray(workspaces))
        return void res.status(400).json({ error: "workspaces array is required" })

      const count = await this.syncService.pushWorkspaces(req.user.id, workspaces)

      res.status(200).json({
        message: "Workspaces synced",
        count
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Workspaces sync failed"
      res.status(500).json({ error: msg })
    }
  }

  pushChanges = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user)
        return void res.status(401).json({ error: "Not authenticated" })

      const { changes } = req.body
      if (!Array.isArray(changes))
        return void res.status(400).json({ error: "changes array is required" })

      const result = await this.syncService.pushChanges(req.user.id, changes)

      res.status(200).json({
        message: "Sync push complete",
        result
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync push failed"
      res.status(500).json({ error: msg })
    }
  }

  pullChanges = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { workspaceId, since } = req.query

      if (!workspaceId || typeof workspaceId !== "string")
        return void res.status(400).json({ error: "workspaceId query param is required" })

      const sinceDate = since ? new Date(since as string) : new Date(0)
      const files = await this.syncService.pullChanges(workspaceId, sinceDate)

      res.status(200).json({
        files: files.map(f => f.toJSON()),
        pulledAt: new Date().toISOString()
      })
    } catch {
      res.status(500).json({ error: "Sync pull failed" })
    }
  }

  resolveConflict = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fileId, resolution, localContent } = req.body

      if (!fileId || !resolution)
        return void res.status(400).json({ error: "fileId and resolution are required" })

      if (!["local", "cloud"].includes(resolution))
        return void res.status(400).json({ error: 'resolution must be "local" or "cloud"' })

      const file = await this.syncService.resolveConflict(fileId, resolution, localContent)

      res.status(200).json({
        message: "Conflict resolved",
        file: file.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resolve conflict"
      res.status(400).json({ error: msg })
    }
  }

  getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { workspaceId } = req.query

      if (!workspaceId || typeof workspaceId !== "string")
        return void res.status(400).json({ error: "workspaceId query param is required" })

      const status = await this.syncService.getStatus(workspaceId)

      res.status(200).json({ status })
    } catch {
      res.status(500).json({ error: "Failed to fetch sync status" })
    }
  }
}