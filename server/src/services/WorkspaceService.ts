import { PrismaClient } from "@prisma/client"
import { Workspace } from "../models"

export interface CreateWorkspaceDTO {
  name: string
  ownerId: string
}

export interface IWorkspaceService {
  create(data: CreateWorkspaceDTO): Promise<Workspace>
  getAll(userId: string): Promise<Workspace[]>
  findById(id: string): Promise<Workspace>
  update(id: string, name: string): Promise<Workspace>
  delete(id: string, userId: string): Promise<void>
}

export class WorkspaceService implements IWorkspaceService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateWorkspaceDTO): Promise<Workspace> {
    const name = data.name?.trim()

    if (!name) throw new Error("Workspace name is required")
    if (name.length > 100)
      throw new Error("Workspace name cannot exceed 100 characters")

    const existing = await this.prisma.workspace.findFirst({
      where: { name, ownerId: data.ownerId },
    })

    if (existing)
      throw new Error(`Workspace "${name}" already exists`)

    const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    
    const dbWorkspace = await this.prisma.workspace.create({
      data: { 
        id: wsId, // MANDATORY ID LOCK
        name, 
        ownerId: data.ownerId 
      },
    })

    return Workspace.fromPrisma(dbWorkspace)
  }

  async getAll(userId: string): Promise<Workspace[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    })

    return workspaces.map(Workspace.fromPrisma);
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    })

    if (!workspace) throw new Error("Workspace not found")

    return Workspace.fromPrisma(workspace)
  }

  async update(id: string, name: string): Promise<Workspace> {
    const trimmed = name?.trim();
    if (!trimmed) throw new Error("Workspace name is required")

    await this.findById(id)

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: { name: trimmed },
    })

    return Workspace.fromPrisma(workspace);
  }

  async delete(id: string, userId: string): Promise<void> {
    const workspace = await this.findById(id)

    if (workspace.ownerId !== userId)
      throw new Error("You can only delete your own workspaces")

    await this.prisma.file.deleteMany({
      where: { workspaceId: id },
    })

    await this.prisma.workspace.delete({
      where: { id },
    })
  }
}