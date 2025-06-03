/**
 * @file cloud-storage settings page
 * @description Cloud Storage management interface
 * @created 2025-06-02
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Cloud, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  File,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  lastUpload?: string;
}

interface ConnectionStatus {
  success: boolean;
  configured: boolean;
  error?: string;
}

export default function CloudStoragePage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('uploads');
  const [isUploading, setIsUploading] = useState(false);

  // Test R2 connection
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cloud-storage?action=test');
      const data = await response.json();
      
      setConnectionStatus({
        success: data.success,
        configured: data.configured,
        error: data.error
      });

      if (data.success) {
        toast.success('R2 connection successful!');
        loadFiles();
        loadStats();
      } else {
        toast.error(`Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Failed to test connection');
      setConnectionStatus({
        success: false,
        configured: false,
        error: 'Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load files from R2
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/cloud-storage?action=list');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    }
  };

  // Load storage statistics
  const loadStats = async () => {
    try {
      const response = await fetch('/api/cloud-storage?action=stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Upload file to R2
  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', uploadFolder);

      const response = await fetch('/api/cloud-storage', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`File uploaded successfully: ${selectedFile.name}`);
        setSelectedFile(null);
        loadFiles();
        loadStats();
      } else {
        toast.error(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file from R2
  const deleteFile = async (key: string) => {
    try {
      const response = await fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File deleted successfully');
        loadFiles();
        loadStats();
      } else {
        toast.error(`Delete failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete failed');
    }
  };

  // Download file from R2
  const downloadFile = async (key: string, filename: string) => {
    try {
      const response = await fetch(`/api/cloud-storage?action=download&key=${encodeURIComponent(key)}`);
      const data = await response.json();

      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download started');
      } else {
        toast.error('Failed to generate download URL');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (['txt', 'md', 'json'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // Load connection status on mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cloud Storage</h1>
        <p className="text-muted-foreground">
          Manage your Cloudflare R2 storage connection and files
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your R2 cloud storage connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus === null ? (
                <Badge variant="secondary">Testing...</Badge>
              ) : connectionStatus.success ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              {connectionStatus?.configured === false && (
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
          </div>

          {connectionStatus?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{connectionStatus.error}</AlertDescription>
            </Alert>
          )}

          {!connectionStatus?.configured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Required</AlertTitle>
              <AlertDescription>
                Please configure your R2 environment variables:
                R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Storage Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Statistics</CardTitle>
            <CardDescription>Overview of your cloud storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-sm text-muted-foreground">Last Upload</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
          <CardDescription>
            Upload files to your R2 cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="folder">Folder</Label>
              <Input
                id="folder"
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="uploads"
              />
            </div>
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          
          {selectedFile && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFile.name)}
                <span className="font-medium">{selectedFile.name}</span>
                <Badge variant="outline">{formatFileSize(selectedFile.size)}</Badge>
              </div>
            </div>
          )}

          <Button 
            onClick={uploadFile} 
            disabled={!selectedFile || isUploading || !connectionStatus?.success}
            className="w-full"
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Files ({files.length})
          </CardTitle>
          <CardDescription>
            Manage your uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files found
              </div>
            ) : (
              files.map((file) => (
                <div key={file.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.key)}
                    <div>
                      <div className="font-medium">{file.key.split('/').pop()}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.key, file.key.split('/').pop() || 'file')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(file.key)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}