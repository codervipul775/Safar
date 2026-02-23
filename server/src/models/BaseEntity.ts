
// Base class for all models

export abstract class BaseEntity {
  protected _id: string
  protected _createdAt: Date
  protected _updatedAt: Date

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id
    this._createdAt = createdAt ?? new Date()
    this._updatedAt = updatedAt ?? new Date()
  }

  // Getters
  get id(): string {
    return this._id
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  protected touch(): void {
    this._updatedAt = new Date()
  }

  abstract validate(): void

  toJSON() {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}