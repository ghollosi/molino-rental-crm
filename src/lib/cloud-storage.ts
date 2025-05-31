/**
 * Cloudflare R2 Cloud Storage Service
 * 
 * S3-kompatibilis fájltároló szolgáltatás Cloudflare R2-vel
 * Támogatja: upload, download, delete, list műveletek
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment változók típus definíciója
interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

// R2 konfiguráció betöltése environment változókból
function getR2Config(): R2Config {
  const config = {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  };

  // Ellenőrizzük a kötelező környezeti változókat
  if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
    throw new Error('Missing required R2 environment variables. Please check your .env file.');
  }

  return config as R2Config;
}

// S3 Client inicializálás
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getR2Config();
    
    s3Client = new S3Client({
      region: 'auto', // Cloudflare R2 uses 'auto' region
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Needed for R2 compatibility
    });
  }
  
  return s3Client;
}

// Fájl feltöltési típusok
export interface UploadParams {
  key: string;           // Fájl elérési útvonala a bucket-ben
  file: Buffer | Uint8Array | File;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

// Fájl lista típus
export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}

/**
 * Fájl feltöltése a cloud storage-ba
 */
export async function uploadFile(params: UploadParams): Promise<UploadResult> {
  try {
    const config = getR2Config();
    const client = getS3Client();
    
    // File Buffer-re konvertálása ha szükséges
    let fileBuffer: Buffer;
    let fileSize: number;
    
    if (params.file instanceof File) {
      const arrayBuffer = await params.file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileSize = params.file.size;
    } else if (params.file instanceof Buffer) {
      fileBuffer = params.file;
      fileSize = params.file.length;
    } else {
      fileBuffer = Buffer.from(params.file);
      fileSize = params.file.length;
    }

    // Upload parancs létrehozása
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: fileBuffer,
      ContentType: params.contentType || 'application/octet-stream',
      Metadata: params.metadata,
    });

    // Fájl feltöltése
    await client.send(command);

    // Signed URL generálása (mivel a bucket privát)
    const url = await getDownloadUrl(params.key, 86400); // 24 órás lejárat

    return {
      key: params.key,
      url,
      size: fileSize,
    };
  } catch (error) {
    console.error('Cloud storage upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fájl letöltése a cloud storage-ból
 */
export async function downloadFile(key: string): Promise<Buffer> {
  try {
    const config = getR2Config();
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);
    
    if (!response.Body) {
      throw new Error('File not found or empty response');
    }

    // Stream-et Buffer-re konvertálás
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Cloud storage download error:', error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Signed URL generálása fájl letöltéshez
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const config = getR2Config();
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('Cloud storage signed URL error:', error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fájl törlése a cloud storage-ból
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const config = getR2Config();
    const client = getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('Cloud storage delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fájlok listázása a bucket-ben
 */
export async function listFiles(prefix?: string, maxKeys: number = 100): Promise<FileInfo[]> {
  try {
    const config = getR2Config();
    const client = getS3Client();

    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    // Signed URL-eket generálunk minden fájlhoz
    const filesWithUrls = await Promise.all(
      response.Contents.map(async (item) => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        url: await getDownloadUrl(item.Key || '', 3600), // 1 órás lejárat
      }))
    );

    return filesWithUrls;
  } catch (error) {
    console.error('Cloud storage list error:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fájl URL generálása kulcs alapján (signed URL)
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  return await getDownloadUrl(key, expiresIn);
}

/**
 * Cloud storage konfiguráció tesztelése
 */
export async function testConnection(): Promise<boolean> {
  try {
    const config = getR2Config();
    const client = getS3Client();

    // Egyszerű lista hívás a kapcsolat teszteléséhez
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Cloud storage connection test failed:', error);
    return false;
  }
}

/**
 * Utility funkciók
 */

// Fájl extension alapján content type meghatározása
export function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const contentTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}

// Fájl kulcs generálása timestamp-pel
export function generateFileKey(originalName: string, prefix?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return prefix 
    ? `${prefix}/${timestamp}_${sanitizedName}`
    : `${timestamp}_${sanitizedName}`;
}

// Fájl méret formázása
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}