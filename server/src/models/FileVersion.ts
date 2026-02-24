import { BaseEntity } from "./BaseEntity"

export class FileVersion extends BaseEntity {
  private _fileId: string
  private _content: string
  private _versionNumber: number

  constructor(
    id: string,
    fileId: string,
    content: string,
    versionNumber: number,
    createdAt?: Date
  ) {
    super(id, createdAt, createdAt)

    this._fileId = fileId
    this._content = content
    this._versionNumber = versionNumber
  }


  get fileId() {
    return this._fileId
}
  get content() {
    return this._content
}
  get versionNumber() {
    return this._versionNumber
}


  validate(): void {
    if (!this._fileId) {
      throw new Error("File reference is required");
    }

    if (this._content == null) {
      throw new Error("Content cannot be null");
    }

    if (!Number.isInteger(this._versionNumber) || this._versionNumber < 1) {
      throw new Error("Invalid version number");
    }
  }


  getContentSize(): number {
    return new TextEncoder().encode(this._content).length
  }

  getPreview(maxLength: number = 100): string {
    return this._content.length <= maxLength
      ? this._content
      : this._content.slice(0, maxLength) + "..."
  }

  static fromPrisma(data: {
    id: string
    fileId: string
    content: string
    versionNumber: number
    createdAt: Date
  }): FileVersion {
    return new FileVersion(
      data.id,
      data.fileId,
      data.content,
      data.versionNumber,
      data.createdAt
    )
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fileId: this._fileId,
      versionNumber: this._versionNumber,
      contentSize: this.getContentSize(),
      preview: this.getPreview(),
    }
  }
}