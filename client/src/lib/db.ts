import { openDB } from "idb"
import type { DBSchema, IDBPDatabase } from "idb"

// TYPES

export interface LocalWorkspace {
  id: string
  name: string
  ownerId?: string
  ownerEmail?: string
  syncStatus: string
  createdAt: string
  updatedAt: string
}

export interface LocalFile {
  id: string
  name: string
  type: string
  content: string | null
  language: string | null
  parentId: string | null
  workspaceId: string
  ownerId?: string
  ownerEmail?: string
  syncStatus: string
  syncedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LocalFileVersion {
  id: string
  fileId: string
  content: string
  versionNumber: number
  createdAt: string
}

export interface LocalSyncLog {
  id: string
  fileId: string
  action: string
  status: string
  details: string | null
  timestamp: string
}

// SCHEMA

interface SafarSetuDB extends DBSchema {
  workspaces: {
    key: string
    value: LocalWorkspace
    indexes: { "by-syncStatus": string }
  }

  files: {
    key: string
    value: LocalFile
    indexes: {
      "by-workspaceId": string
      "by-parentId": string
      "by-syncStatus": string
    }
  }

  fileVersions: {
    key: string
    value: LocalFileVersion
    indexes: { "by-fileId": string }
  }

  syncLogs: {
    key: string
    value: LocalSyncLog
    indexes: { "by-fileId": string }
  }
}

// DATABASE

const DB_NAME = "safarsetu-pro"
const DB_VERSION = 1

let db: IDBPDatabase<SafarSetuDB> | null = null

export async function getDB() {
  if (db) return db

  db = await openDB<SafarSetuDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<SafarSetuDB>) {

      const ws = db.createObjectStore("workspaces", { keyPath: "id" })
      ws.createIndex("by-syncStatus", "syncStatus")

      const files = db.createObjectStore("files", { keyPath: "id" })
      files.createIndex("by-workspaceId", "workspaceId")
      files.createIndex("by-parentId", "parentId")
      files.createIndex("by-syncStatus", "syncStatus")

      const versions = db.createObjectStore("fileVersions", { keyPath: "id" })
      versions.createIndex("by-fileId", "fileId")

      const logs = db.createObjectStore("syncLogs", { keyPath: "id" })
      logs.createIndex("by-fileId", "fileId")
    }
  })

  return db
}

// UTIL

export const generateId = () => crypto.randomUUID()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function put(store: any, value: any) {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  await tx.store.put(value)
  await tx.done
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get(store: any, key: string) {
  const db = await getDB()
  return db.get(store, key)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function del(store: any, key: string) {
  const db = await getDB()
  return db.delete(store, key)
}

// WORKSPACES

export async function getAllWorkspaces() {
  const db = await getDB()
  return db.getAll("workspaces")
}

export const getWorkspace = (id: string) =>
  get("workspaces", id)

export const saveWorkspace = (ws: LocalWorkspace) =>
  put("workspaces", ws)

export const deleteWorkspace = (id: string) =>
  del("workspaces", id)

// FILES

export async function getFilesByWorkspace(workspaceId: string) {
  const db = await getDB()
  return db.getAllFromIndex("files", "by-workspaceId", workspaceId)
}

export const getFile = (id: string) =>
  get("files", id)

export const saveFile = (file: LocalFile) =>
  put("files", file)

export const deleteFile = (id: string) =>
  del("files", id)

export async function deleteFileRecursive(id: string) {
  const db = await getDB()
  const file = await db.get("files", id)
  if (!file) return

  // If it's a folder, recursively delete children
  const children = await db.getAllFromIndex("files", "by-parentId", id)
  for (const child of children) {
    await deleteFileRecursive(child.id)
  }

  await db.delete("files", id)
}

// FILE VERSIONS

export async function getFileVersions(fileId: string) {
  const db = await getDB()
  return db.getAllFromIndex("fileVersions", "by-fileId", fileId)
}

export const saveFileVersion = (v: LocalFileVersion) =>
  put("fileVersions", v)

// SYNC LOGS

export async function getSyncLogs(fileId: string) {
  const db = await getDB()
  return db.getAllFromIndex("syncLogs", "by-fileId", fileId)
}

export const saveSyncLog = (log: LocalSyncLog) =>
  put("syncLogs", log)

// CLEAR ALL DATA (used on logout to prevent cross-account data leaks)

export async function clearAllData() {
  const db = await getDB()
  const tx = db.transaction(["workspaces", "files", "fileVersions", "syncLogs"], "readwrite")
  await Promise.all([
    tx.objectStore("workspaces").clear(),
    tx.objectStore("files").clear(),
    tx.objectStore("fileVersions").clear(),
    tx.objectStore("syncLogs").clear(),
    tx.done
  ])
}