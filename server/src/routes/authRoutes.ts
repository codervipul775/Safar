import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { authMiddleware } from "../middleware/authMiddleware"
import { AuthService } from "../services"

export const createAuthRoutes = (authService: AuthService): Router => {
  const router = Router()
  const controller = new AuthController(authService)
  const protect = authMiddleware(authService)

  router.post("/register", controller.register)
  router.post("/login", controller.login)
  router.get("/profile", protect, controller.getProfile)

  return router
}