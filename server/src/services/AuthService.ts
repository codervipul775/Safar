import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { User } from "../models"

export interface RegisterDTO {
  name: string
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResult {
  token: string
  user: User
}

export interface IAuthService {
  register(data: RegisterDTO): Promise<AuthResult>
  login(data: LoginDTO): Promise<AuthResult>
  verifyToken(token: string): Promise<User>
}

export class AuthService implements IAuthService {
  private jwtSecret = process.env.JWT_SECRET || "default-secret-change-this"
  private saltRounds = 10

  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterDTO): Promise<AuthResult> {
    const { name, email, password } = data

    if (!name?.trim()) throw new Error("Name is required")
    if (!email || !User.isValidEmail(email)) throw new Error("Valid email is required")
    if (!password || password.length < 6)
      throw new Error("Password must be at least 6 characters")

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) throw new Error("Email already registered")

    const passwordHash = await bcrypt.hash(password, this.saltRounds)

    const dbUser = await this.prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    })

    const user = User.fromPrisma(dbUser);
    const token = this.generateToken(user.id);

    return { token, user }
  }

  async login(data: LoginDTO): Promise<AuthResult> {
    const { email, password } = data

    if (!email || !password)
      throw new Error("Email and password are required")

    const normalizedEmail = email.toLowerCase().trim()

    const dbUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!dbUser) throw new Error("Invalid email or password")

    const isValid = await bcrypt.compare(password, dbUser.passwordHash)
    if (!isValid) throw new Error("Invalid email or password")

    const user = User.fromPrisma(dbUser)
    const token = this.generateToken(user.id)

    return { token, user }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const { userId } = jwt.verify(token, this.jwtSecret) as { userId: string }

      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!dbUser) throw new Error("User not found")

      return User.fromPrisma(dbUser)
    } catch {
      throw new Error("Invalid or expired token")
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: "7d",
    })
  }
}