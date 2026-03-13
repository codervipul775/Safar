import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { PrismaClient } from "./generated/prisma/client"

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

// services
const authService = new AuthService(prisma)
const workspaceService = new WorkspaceService(prisma)
const fileService = new FileService(prisma)
const syncService = new SyncService(prisma)

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