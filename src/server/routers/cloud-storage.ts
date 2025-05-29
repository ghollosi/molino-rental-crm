/**
 * Cloud Storage tRPC Router
 * 
 * tRPC integráció a cloud storage funkciókhoz
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  listFiles, 
  testConnection, 
  getDownloadUrl, 
  generateFileKey, 
  getContentType 
} from '@/src/lib/cloud-storage';

// Input validáció sémák
const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  fileBase64: z.string().min(1),
  prefix: z.string().optional(),
  contentType: z.string().optional(),
});

const downloadFileSchema = z.object({
  key: z.string().min(1),
});

const deleteFileSchema = z.object({
  key: z.string().min(1),
});

const listFilesSchema = z.object({
  prefix: z.string().optional(),
  maxKeys: z.number().min(1).max(1000).default(100),
});

const getDownloadUrlSchema = z.object({
  key: z.string().min(1),
  expiresIn: z.number().min(60).max(86400).default(3600), // 1 óra alapértelmezett
});

export const cloudStorageRouter = createTRPCRouter({
  // Kapcsolat tesztelése
  testConnection: publicProcedure
    .query(async () => {
      try {
        const isConnected = await testConnection();
        return {
          success: true,
          connected: isConnected,
          message: isConnected ? 'Connection successful' : 'Connection failed',
        };
      } catch (error) {
        return {
          success: false,
          connected: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Fájl feltöltése (Base64 string-ből)
  uploadFile: publicProcedure
    .input(uploadFileSchema)
    .mutation(async ({ input }) => {
      try {
        // Base64 string Buffer-re konvertálása
        const fileBuffer = Buffer.from(input.fileBase64, 'base64');
        
        // Fájl kulcs generálása
        const fileKey = generateFileKey(input.fileName, input.prefix);
        
        // Content type meghatározása
        const contentType = input.contentType || getContentType(input.fileName);

        // Fájl feltöltése
        const result = await uploadFile({
          key: fileKey,
          file: fileBuffer,
          contentType: contentType,
          metadata: {
            originalName: input.fileName,
            uploadedAt: new Date().toISOString(),
          },
        });

        return {
          success: true,
          data: result,
          message: 'File uploaded successfully',
        };
      } catch (error) {
        throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Fájl letöltése (Buffer-ként)
  downloadFile: publicProcedure
    .input(downloadFileSchema)
    .query(async ({ input }) => {
      try {
        const fileBuffer = await downloadFile(input.key);
        
        return {
          success: true,
          data: {
            buffer: fileBuffer.toString('base64'),
            key: input.key,
            size: fileBuffer.length,
          },
          message: 'File downloaded successfully',
        };
      } catch (error) {
        throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Signed download URL generálása
  getDownloadUrl: publicProcedure
    .input(getDownloadUrlSchema)
    .query(async ({ input }) => {
      try {
        const url = await getDownloadUrl(input.key, input.expiresIn);
        
        return {
          success: true,
          data: {
            url: url,
            key: input.key,
            expiresIn: input.expiresIn,
            expiresAt: new Date(Date.now() + input.expiresIn * 1000).toISOString(),
          },
          message: 'Download URL generated successfully',
        };
      } catch (error) {
        throw new Error(`URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Fájl törlése
  deleteFile: publicProcedure
    .input(deleteFileSchema)
    .mutation(async ({ input }) => {
      try {
        await deleteFile(input.key);
        
        return {
          success: true,
          data: { key: input.key },
          message: 'File deleted successfully',
        };
      } catch (error) {
        throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Fájlok listázása
  listFiles: publicProcedure
    .input(listFilesSchema)
    .query(async ({ input }) => {
      try {
        const files = await listFiles(input.prefix, input.maxKeys);
        
        return {
          success: true,
          data: files,
          count: files.length,
          message: `Found ${files.length} files`,
        };
      } catch (error) {
        throw new Error(`List files failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Fájl információk lekérése (meta adatok)
  getFileInfo: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        // Lista API használata egy fájl info lekérésére
        const files = await listFiles(input.key, 1);
        const file = files.find(f => f.key === input.key);
        
        if (!file) {
          throw new Error('File not found');
        }
        
        return {
          success: true,
          data: file,
          message: 'File info retrieved successfully',
        };
      } catch (error) {
        throw new Error(`Get file info failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  // Storage stats (opcionális, hasznos lehet)
  getStorageStats: publicProcedure
    .query(async () => {
      try {
        const files = await listFiles(undefined, 1000); // Max 1000 fájl
        
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const fileCount = files.length;
        
        // Fájltípusok szerint csoportosítás
        const fileTypes: Record<string, number> = {};
        files.forEach(file => {
          const ext = file.key.split('.').pop()?.toLowerCase() || 'unknown';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });
        
        return {
          success: true,
          data: {
            totalFiles: fileCount,
            totalSize: totalSize,
            totalSizeFormatted: formatFileSize(totalSize),
            fileTypes: fileTypes,
            averageFileSize: fileCount > 0 ? Math.round(totalSize / fileCount) : 0,
          },
          message: 'Storage stats retrieved successfully',
        };
      } catch (error) {
        throw new Error(`Get storage stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});

// Helper függvény fájl méret formázáshoz
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}