import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import COS = require('cos-nodejs-sdk-v5')
import { S3Storage } from 'coze-coding-dev-sdk'

interface UploadFileInput {
  fileContent: Buffer
  fileName: string
  contentType?: string
  bucket?: string
}

interface PresignedUrlInput {
  key: string
  bucket?: string
  expireTime?: number
}

export interface FileStorage {
  uploadFile(input: UploadFileInput): Promise<string>
  generatePresignedUrl(input: PresignedUrlInput): Promise<string>
  readFile?(input: { fileKey: string; bucket?: string }): Promise<Buffer>
  deleteFile?(input: { fileKey: string; bucket?: string }): Promise<boolean>
  fileExists?(input: { fileKey: string; bucket?: string }): Promise<boolean>
}

const trimEnv = (value?: string) => value?.trim() || ''

export const hasTencentCosConfigured = () =>
  Boolean(
    trimEnv(process.env.COS_SECRET_ID) &&
      trimEnv(process.env.COS_SECRET_KEY) &&
      trimEnv(process.env.COS_BUCKET) &&
      trimEnv(process.env.COS_REGION),
  )

export const hasCloudObjectStorageConfigured = () =>
  Boolean(
    trimEnv(process.env.COZE_BUCKET_ENDPOINT_URL) &&
      trimEnv(process.env.COZE_BUCKET_NAME) &&
      trimEnv(process.env.COZE_WORKLOAD_IDENTITY_API_KEY),
  )

const sanitizeSegment = (segment: string) => {
  const safe = segment
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')

  return safe || 'file'
}

const encodeKey = (key: string) =>
  key
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')

class LocalFileStorage implements FileStorage {
  private readonly uploadRoot: string
  private readonly publicBaseUrl: string

  constructor() {
    this.uploadRoot = path.resolve(
      process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    )
    this.publicBaseUrl = trimEnv(process.env.PUBLIC_BASE_URL).replace(/\/$/, '')
  }

  private buildKey(fileName: string) {
    const normalized = fileName.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(Boolean).map(sanitizeSegment)
    const rawKey = segments.length > 0 ? segments.join('/') : 'file'
    const parsed = path.posix.parse(rawKey)
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8)

    return path.posix.join(parsed.dir, `${parsed.name}_${suffix}${parsed.ext}`)
  }

  private resolveKey(key: string) {
    const safeKey = key
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .map(sanitizeSegment)
      .join('/')
    const resolved = path.resolve(this.uploadRoot, safeKey)

    if (!resolved.startsWith(`${this.uploadRoot}${path.sep}`)) {
      throw new Error('Invalid file key')
    }

    return { safeKey, resolved }
  }

  async uploadFile(input: UploadFileInput) {
    const key = this.buildKey(input.fileName)
    const { resolved } = this.resolveKey(key)

    await fs.mkdir(path.dirname(resolved), { recursive: true })
    await fs.writeFile(resolved, input.fileContent)

    return key
  }

  async generatePresignedUrl(input: PresignedUrlInput) {
    const { safeKey } = this.resolveKey(input.key)
    const urlPath = `/api/uploads/${encodeKey(safeKey)}`

    return this.publicBaseUrl ? `${this.publicBaseUrl}${urlPath}` : urlPath
  }

  async readFile(input: { fileKey: string }) {
    const { resolved } = this.resolveKey(input.fileKey)
    return fs.readFile(resolved)
  }

  async deleteFile(input: { fileKey: string }) {
    const { resolved } = this.resolveKey(input.fileKey)
    await fs.rm(resolved, { force: true })
    return true
  }

  async fileExists(input: { fileKey: string }) {
    const { resolved } = this.resolveKey(input.fileKey)
    try {
      await fs.access(resolved)
      return true
    } catch {
      return false
    }
  }
}

class TencentCosStorage implements FileStorage {
  private readonly bucket = trimEnv(process.env.COS_BUCKET)
  private readonly region = trimEnv(process.env.COS_REGION)
  private readonly cos: COS

  constructor() {
    this.cos = new COS({
      SecretId: trimEnv(process.env.COS_SECRET_ID),
      SecretKey: trimEnv(process.env.COS_SECRET_KEY),
      Protocol: 'https:',
    })
  }

  private buildKey(fileName: string) {
    const normalized = fileName.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(Boolean).map(sanitizeSegment)
    const rawKey = segments.length > 0 ? segments.join('/') : 'file'
    const parsed = path.posix.parse(rawKey)
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8)

    return path.posix.join(parsed.dir, `${parsed.name}_${suffix}${parsed.ext}`)
  }

  async uploadFile(input: UploadFileInput) {
    const key = this.buildKey(input.fileName)

    await this.cos.putObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: key,
      Body: input.fileContent,
      ContentLength: input.fileContent.length,
      ContentType: input.contentType || 'application/octet-stream',
    })

    return key
  }

  async generatePresignedUrl(input: PresignedUrlInput) {
    return this.cos.getObjectUrl({
      Bucket: this.bucket,
      Region: this.region,
      Key: input.key,
      Sign: true,
      Method: 'GET',
      Expires: input.expireTime || 86400,
      Protocol: 'https:',
    })
  }

  async deleteFile(input: { fileKey: string }) {
    await this.cos.deleteObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: input.fileKey,
    })
    return true
  }

  async fileExists(input: { fileKey: string }) {
    try {
      await this.cos.headObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: input.fileKey,
      })
      return true
    } catch {
      return false
    }
  }
}

export const createFileStorage = (): FileStorage => {
  if (hasTencentCosConfigured()) {
    return new TencentCosStorage()
  }

  if (hasCloudObjectStorageConfigured()) {
    return new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  return new LocalFileStorage()
}
