import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'

type S3Config = {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

function getS3Config(event: H3Event): S3Config {
  const { s3 } = useRuntimeConfig(event)
  return {
    endpoint: s3.endpoint,
    region: s3.region,
    accessKeyId: s3.accessKeyId,
    secretAccessKey: s3.secretAccessKey,
    bucket: s3.bucket
  }
}

export function getS3Client(event: H3Event) {
  const cfg = getS3Config(event)
  return new S3Client({
    endpoint: cfg.endpoint || undefined,
    region: cfg.region,
    forcePathStyle: Boolean(cfg.endpoint),
    credentials: cfg.accessKeyId && cfg.secretAccessKey ? {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    } : undefined
  })
}

export function getS3Bucket(event: H3Event) {
  return getS3Config(event).bucket
}

export async function s3ListAllKeys(event: H3Event, params: { prefix?: string }) {
  const client = getS3Client(event)
  const bucket = getS3Bucket(event)

  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const res = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: params.prefix || undefined,
      ContinuationToken: continuationToken
    }))
    continuationToken = res.NextContinuationToken
    for (const obj of res.Contents || []) {
      if (obj.Key) keys.push(obj.Key)
    }
  } while (continuationToken)

  return keys
}

export async function s3GetObjectText(event: H3Event, key: string) {
  const client = getS3Client(event)
  const bucket = getS3Bucket(event)

  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!res.Body) return ''
  return await res.Body.transformToString('utf-8')
}

export async function s3HeadObject(event: H3Event, key: string) {
  const client = getS3Client(event)
  const bucket = getS3Bucket(event)
  return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
}

export async function s3SignedGetUrl(event: H3Event, key: string, expiresInSeconds = 60) {
  const client = getS3Client(event)
  const bucket = getS3Bucket(event)
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
  return await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds })
}
