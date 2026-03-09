import { Request, Response, NextFunction } from "express"
import { AuthService } from "../services"
import { User } from "../models"

export interface AuthRequest extends Request {
  user?: User
}

export const authMiddleware = (authService: AuthService) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization

      if (!header?.startsWith("Bearer "))
        return void res.status(401).json({ error: "No token provided" })

      const token = header.split(" ")[1]

      const user = await authService.verifyToken(token)
      req.user = user

      next()
    } catch {
      res.status(401).json({ error: "Invalid or expired token" })
    }
  }