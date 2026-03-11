import { Response } from "express"
import { FileService } from "../services"
import { FileType } from "../models"
import { AuthRequest } from "../middleware/authMiddleware"

export class FileController {
  constructor(private fileService: FileService) {}

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, type, workspaceId, parentId, content, language } = req.body

      if (!Object.values(FileType).includes(type))
        return void res.status(400).json({
          error: `Invalid file type. Must be one of: ${Object.values(FileType).join(", ")}`
        })

      const file = await this.fileService.create({
        name,
        type,
        workspaceId,
        parentId: parentId || null,
        content,
        language: language || null
      })

      res.status(201).json({
        message: "File created",
        file: file.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create file"
      res.status(400).json({ error: msg })
    }
  }

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, content, syncStatus } = req.body

      const file = await this.fileService.update(req.params.id, {
        name,
        content,
        syncStatus
      })

      res.status(200).json({
        message: "File updated",
        file: file.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update file"
      res.status(400).json({ error: msg })
    }
  }

  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.fileService.delete(req.params.id)

      res.status(200).json({
        message: "File deleted"
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete file"
      res.status(400).json({ error: msg })
    }
  }

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const file = await this.fileService.findById(req.params.id)

      res.status(200).json({
        file: file.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "File not found"
      res.status(404).json({ error: msg })
    }
  }

  getTree = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tree = await this.fileService.getTree(req.params.workspaceId)

      res.status(200).json({
        files: tree.map(f => f.toJSON())
      })
    } catch {
      res.status(500).json({ error: "Failed to fetch file tree" })
    }
  }

  getVersions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const versions = await this.fileService.getVersions(req.params.id)

      res.status(200).json({
        versions: versions.map(v => v.toJSON())
      })
    } catch {
      res.status(500).json({ error: "Failed to fetch versions" })
    }
  }

  restoreVersion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { versionId } = req.body

      if (!versionId)
        return void res.status(400).json({ error: "versionId is required" })

      const file = await this.fileService.restoreVersion(req.params.id, versionId)

      res.status(200).json({
        message: "Version restored",
        file: file.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to restore version"
      res.status(400).json({ error: msg })
    }
  }
}