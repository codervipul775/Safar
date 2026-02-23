
import { BaseEntity } from "./BaseEntity"

export class User extends BaseEntity {
  private _email: string
  private _name: string
  private _passwordHash: string

  constructor(
    id: string,
    email: string,
    name: string,
    passwordHash: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt)
    this._email = email
    this._name = name
    this._passwordHash = passwordHash
  }

  
  get email(): string {
    return this._email
  }

  get name(): string {
    return this._name
  }

  get passwordHash(): string {
    return this._passwordHash
  }
  set name(value: string) {
    if (!value.trim()) {
      throw new Error("Name cannot be empty");
    }
    this._name = value.trim()
    this.touch()
  }

  set email(value: string) {
    if (!User.isValidEmail(value)) {
      throw new Error("Invalid email");
    }
    this._email = value.trim().toLowerCase();
    this.touch();
  }
  validate(): void {
    if (!User.isValidEmail(this._email)) {
      throw new Error("Invalid email")
    }

    if (!this._name.trim()) {
      throw new Error("Name is required")
    }

    if (!this._passwordHash) {
      throw new Error("Password hash is required")
    }
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  static fromPrisma(data: {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
  }): User {
    return new User(
      data.id,
      data.email,
      data.name,
      data.passwordHash,
      data.createdAt,
      data.updatedAt
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      email: this._email,
      name: this._name,
    }
  }
}