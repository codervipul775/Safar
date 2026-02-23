// Workspace.ts

import { BaseEntity } from "./BaseEntity"

export class Workspace extends BaseEntity {
  private _name: string
  private _ownerId: string

  constructor(
    id: string,
    name: string,
    ownerId: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt)
    this._name = name
    this._ownerId = ownerId
  }

  get name(): string {
    return this._name
  }

  get ownerId(): string {
    return this._ownerId
  }

  set name(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error("Workspace name is required");
    }

    if (trimmed.length > 100) {
      throw new Error("Workspace name cannot exceed 100 characters");
    }

    this._name = trimmed
    this.touch()
  }

  validate(): void {
    if (!this._name.trim()) {
      throw new Error("Workspace name is required");
    }

    if (this._name.trim().length > 100) {
      throw new Error("Workspace name cannot exceed 100 characters");
    }

    if (!this._ownerId) {
      throw new Error("Owner is required");
    }
  }

  static fromPrisma(data: {
    id: string
    name: string
    ownerId: string
    createdAt: Date
    updatedAt: Date
  }): Workspace {
    return new Workspace(
      data.id,
      data.name,
      data.ownerId,
      data.createdAt,
      data.updatedAt
    )
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this._name,
      ownerId: this._ownerId,
    }
  }
}