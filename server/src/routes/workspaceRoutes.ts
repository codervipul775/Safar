import { Router } from "express"
import { WorkspaceController } from "../controllers/WorkspaceController"
import { authMiddleware } from "../middleware/authMiddleware"
import { AuthService, WorkspaceService } from "../services"

export const createWorkspaceRoutes = (
  workspaceService: WorkspaceService,
  authService: AuthService
): Router => {
  const router = Router()
  const controller = new WorkspaceController(workspaceService)

  router.use(authMiddleware(authService))

  router.post("/", controller.create)
  router.get("/", controller.getAll)
  router.get("/:id", controller.getById)
  router.put("/:id", controller.update)
  router.delete("/:id", controller.delete)

  return router
}