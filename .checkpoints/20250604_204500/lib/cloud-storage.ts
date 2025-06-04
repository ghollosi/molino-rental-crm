/**
 * @file cloud-storage.ts
 * @description Cloudflare R2 Storage Service Implementation
 * @created 2025-06-02
 * @see DEVELOPMENT_DOCS.md - Storage section
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration interface
interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

// Upload result interface
interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// File list interface
interface FileListItem {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}

// Storage stats interface
interface StorageStats {
  totalFiles: number;
  totalSize: number;
  lastUpload?: Date;
}

class CloudStorageService {
  private client: S3Client | null = null;
  private config: R2Config | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const endpoint = process.env.R2_ENDPOINT;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucket = process.env.R2_BUCKET;

      if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
        console.warn('R2 configuration incomplete, using fallback mode');
        return;
      }

      this.config = {
        endpoint,
        accessKeyId,
        secretAccessKey,
        bucket,
        publicUrl: process.env.R2_PUBLIC_URL
      };

      this.client = new S3Client({
        region: 'auto', // Cloudflare R2 uses 'auto'
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        forcePathStyle: true, // Required for R2
      });

      console.log('✅ R2 Cloud Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize R2 client:', error);
    }
  }

  // Test connection to R2
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.config) {
      return { success: false, error: 'R2 client not initialized' };
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 1
      });

      await this.client.send(command);
      return { success: true };
    } catch (error: any) {
      console.error('R2 connection test failed:', error);
      return { 
        success: false, 
        error: error.message || 'Connection test failed' 
      };
    }
  }

  // Upload file to R2
  async uploadFile(
    file: Buffer | Uint8Array, 
    fileName: string, 
    contentType?: string,
    folder?: string
  ): Promise<UploadResult> {
    if (!this.client || !this.config) {
      return { success: false, error: 'R2 client not initialized' };
    }

    try {
      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${randomSuffix}-${sanitizedFileName}`;
      
      const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: contentType || 'application/octet-stream',
      });

      const result = await this.client.send(command);

      // Generate public URL
      const url = this.config.publicUrl 
        ? `${this.config.publicUrl}/${key}`
        : `${this.config.endpoint}/${this.config.bucket}/${key}`;

      return {
        success: true,
        url,
        key
      };
    } catch (error: any) {
      console.error('R2 upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Get signed URL for file download
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
    if (!this.client || !this.config) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }
  }

  // Delete file from R2
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.config) {
      return { success: false, error: 'R2 client not initialized' };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      await this.client.send(command);
      return { success: true };
    } catch (error: any) {
      console.error('R2 delete failed:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  // List files in bucket
  async listFiles(prefix?: string, maxKeys = 100): Promise<FileListItem[]> {
    if (!this.client || !this.config) {
      return [];
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      });

      const result = await this.client.send(command);
      
      if (!result.Contents) {
        return [];
      }

      return result.Contents.map(item => ({
        key: item.Key!,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        url: this.config!.publicUrl 
          ? `${this.config!.publicUrl}/${item.Key}`
          : `${this.config!.endpoint}/${this.config!.bucket}/${item.Key}`
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    const files = await this.listFiles();
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const lastUpload = files.length > 0 
      ? new Date(Math.max(...files.map(f => f.lastModified.getTime())))
      : undefined;

    return {
      totalFiles: files.length,
      totalSize,
      lastUpload
    };
  }

  // Get file info
  async getFileInfo(key: string): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    if (!this.client || !this.config) {
      return { exists: false };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      const result = await this.client.send(command);
      
      return {
        exists: true,
        size: result.ContentLength,
        contentType: result.ContentType
      };
    } catch (error) {
      return { exists: false };
    }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if R2 is configured and available
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }
}

// Export singleton instance
export const cloudStorage = new CloudStorageService();

// Export types
export type { UploadResult, FileListItem, StorageStats };