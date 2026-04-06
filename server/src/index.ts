import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

import { AuthService, WorkspaceService, FileService, SyncService } from "./services"
import { createAuthRoutes, createWorkspaceRoutes, createFileRoutes, createSyncRoutes } from "./routes"

import { FileController } from "./controllers/FileController"
import { authMiddleware } from "./middleware/authMiddleware"

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Root handler to confirm API is live
app.get("/", (_req, res) => {
  res.json({
    message: "Safar API is Live 🚀",
    status: "healthy",
    documentation: "Refer to the Studio README for API usage",
    timestamp: new Date().toISOString()
  })
})

// services
const authService = new AuthService(prisma as any)
const workspaceService = new WorkspaceService(prisma as any)
const fileService = new FileService(prisma as any)
const syncService = new SyncService(prisma as any)

// routes
app.use("/api/auth", createAuthRoutes(authService))
app.use("/api/workspaces", createWorkspaceRoutes(workspaceService, authService))
app.use("/api/files", createFileRoutes(fileService, authService))
app.use("/api/sync", createSyncRoutes(syncService, authService))

// workspace file tree
const fileController = new FileController(fileService)

app.get(
  "/api/workspaces/:workspaceId/files",
  authMiddleware(authService),
  fileController.getTree
)

// health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Safar API",
    time: new Date().toISOString()
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message)
  res.status(500).json({ error: "Internal server error" })
})

async function start() {
  try {
    await prisma.$connect()
    console.log("MongoDB connected")

    app.listen(PORT, () => {
      console.log(`Safar API running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error("Server start failed", err)
    process.exit(1)
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()