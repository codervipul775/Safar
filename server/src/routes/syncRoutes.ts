import { Router } from "express"
import { SyncController } from "../controllers/SyncController"
import { authMiddleware } from "../middleware/authMiddleware"
import { AuthService, SyncService } from "../services"

export const createSyncRoutes = (
  syncService: SyncService,
  authService: AuthService
): Router => {
  const router = Router()
  const controller = new SyncController(syncService)

  router.use(authMiddleware(authService))

  router.post("/push", controller.pushChanges)
  router.post("/workspaces", controller.pushWorkspaces)
  router.get("/pull", controller.pullChanges)
  router.post("/resolve", controller.resolveConflict)
  router.get("/status", controller.getStatus)

  return router
}