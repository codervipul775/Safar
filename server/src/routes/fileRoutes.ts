import { Router } from "express"
import { FileController } from "../controllers/FileController"
import { authMiddleware } from "../middleware/authMiddleware"
import { AuthService, FileService } from "../services"

export const createFileRoutes = (
  fileService: FileService,
  authService: AuthService
): Router => {
  const router = Router()
  const controller = new FileController(fileService)

  router.use(authMiddleware(authService))

  router.post("/", controller.create)
  router.get("/:id", controller.getById)
  router.put("/:id", controller.update)
  router.delete("/:id", controller.delete)
  router.get("/:id/versions", controller.getVersions)
  router.post("/:id/restore", controller.restoreVersion)

  return router
}