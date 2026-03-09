import { Request, Response } from "express"
import { AuthService } from "../services"
import { AuthRequest } from "../middleware/authMiddleware"

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body
      const result = await this.authService.register({ name, email, password })

      res.status(201).json({
        message: "Registration successful",
        token: result.token,
        user: result.user.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      res.status(400).json({ error: msg })
    }
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body
      const result = await this.authService.login({ email, password })

      res.status(200).json({
        message: "Login successful",
        token: result.token,
        user: result.user.toJSON()
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed"
      res.status(401).json({ error: msg })
    }
  }

  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user)
      return void res.status(401).json({ error: "Not authenticated" })

    res.status(200).json({
      user: req.user.toJSON()
    })
  }
}