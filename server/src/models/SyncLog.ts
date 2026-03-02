import { BaseEntity } from "./BaseEntity"

export enum SyncAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  RESOLVE_CONFLICT = "RESOLVE_CONFLICT",
}

export enum SyncLogStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
}

export class SyncLog extends BaseEntity {
  private _fileId: string
  private _action: SyncAction
  private _status: SyncLogStatus
  private _details: string | null
  private _timestamp: Date

  constructor(
    id: string,
    fileId: string,
    action: SyncAction,
    status: SyncLogStatus = SyncLogStatus.PENDING,
    details: string | null = null,
    timestamp?: Date,
    createdAt?: Date
  ) {
    super(id, createdAt, createdAt);

    this._fileId = fileId
    this._action = action
    this._status = status
    this._details = details
    this._timestamp = timestamp ?? new Date()
  }

  get fileId() { return this._fileId }
  get action() { return this._action }
  get status() { return this._status }
  get details() { return this._details }
  get timestamp() { return this._timestamp }

  // State changes
  markSuccess(): void {
    if (this._status !== SyncLogStatus.PENDING) {
      throw new Error("Cannot mark as success")
    }
    this._status = SyncLogStatus.SUCCESS
    this.touch()
  }

  markFailed(message: string): void {
    if (this._status !== SyncLogStatus.PENDING) {
      throw new Error("Cannot mark as failed")
    }
    this._status = SyncLogStatus.FAILED
    this._details = message
    this.touch()
  }

  // Helpers
  isFailed(): boolean {
    return this._status === SyncLogStatus.FAILED
  }

  isPending(): boolean {
    return this._status === SyncLogStatus.PENDING
  }

  getSummary(): string {
    const action = this._action.toLowerCase().replace("_", " ")
    return `[${this._status}] ${action} at ${this._timestamp.toISOString()}`
  }

  // Validation
  validate(): void {
    if (!this._fileId) throw new Error("File reference is required")
    if (!Object.values(SyncAction).includes(this._action))
      throw new Error("Invalid action")
    if (!Object.values(SyncLogStatus).includes(this._status))
      throw new Error("Invalid status")
  }

  // Factory
  static fromPrisma(data: {
    id: string
    fileId: string
    action: string
    status: string
    details: string | null
    timestamp: Date
  }): SyncLog {
    return new SyncLog(
      data.id,
      data.fileId,
      data.action as SyncAction,
      data.status as SyncLogStatus,
      data.details,
      data.timestamp
    )
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fileId: this._fileId,
      action: this._action,
      status: this._status,
      details: this._details,
      timestamp: this._timestamp.toISOString(),
      summary: this.getSummary(),
    }
  }
}