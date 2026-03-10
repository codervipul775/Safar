import { Response } from "express"
import { WorkspaceService } from "../services"
import { AuthRequest } from "../middleware/authMiddleware"

export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  private getUserId(req: AuthRequest) {
    if (!req.user) throw new Error("Not authenticated")
    return req.user.id
  }

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req)
      const { name } = req.body

      const workspace = await this.workspaceService.create({
        name,
        ownerId: userId
      })

      res.status(201).json({
        message: "Workspace created",
        workspace: workspace.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create workspace"
      res.status(400).json({ error: msg })
    }
  }

  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req)
      const workspaces = await this.workspaceService.getAll(userId)

      res.status(200).json({
        workspaces: workspaces.map(w => w.toJSON())
      })
    } catch {
      res.status(500).json({ error: "Failed to fetch workspaces" })
    }
  }

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const workspace = await this.workspaceService.findById(req.params.id)

      res.status(200).json({
        workspace: workspace.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Workspace not found"
      res.status(404).json({ error: msg })
    }
  }

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name } = req.body
      const workspace = await this.workspaceService.update(req.params.id, name)

      res.status(200).json({
        message: "Workspace updated",
        workspace: workspace.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update workspace"
      res.status(400).json({ error: msg })
    }
  }

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req)

      await this.workspaceService.delete(req.params.id, userId)

      res.status(200).json({
        message: "Workspace deleted"
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete workspace"
      res.status(400).json({ error: msg })
    }
  }
}