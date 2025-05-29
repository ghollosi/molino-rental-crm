'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { FileIcon, Upload, Download, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FileInfo {
  key: string;
  size: number;
  lastModified: string;
  url: string;
}

interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export default function CloudStoragePage() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Üzenet megjelenítése
  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Kapcsolat tesztelése
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cloud-storage?action=test');
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(data.connected);
        showMessage(data.message, data.connected ? 'success' : 'error');
      } else {
        setIsConnected(false);
        showMessage('Connection test failed', 'error');
      }
    } catch (error) {
      setIsConnected(false);
      showMessage(`Connection error: ${error}`, 'error');
    }
    setIsLoading(false);
  };

  // Fájl feltöltése
  const handleUpload = async () => {
    if (!uploadFile) {
      showMessage('Please select a file first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('prefix', 'test-uploads');

      const response = await fetch('/api/cloud-storage', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data.data);
        showMessage('File uploaded successfully!', 'success');
        loadFiles(); // Frissítjük a fájllistát
      } else {
        showMessage(`Upload failed: ${data.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Upload error: ${error}`, 'error');
    }
    setIsLoading(false);
  };

  // Fájlok betöltése
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cloud-storage?action=list&prefix=test-uploads&maxKeys=50');
      const data = await response.json();

      if (data.success) {
        setFiles(data.data);
        showMessage(`Loaded ${data.count} files`, 'info');
      } else {
        showMessage('Failed to load files', 'error');
      }
    } catch (error) {
      showMessage(`Load files error: ${error}`, 'error');
    }
    setIsLoading(false);
  };

  // Fájl letöltése
  const downloadFile = async (key: string) => {
    try {
      const response = await fetch(`/api/cloud-storage?action=download&key=${encodeURIComponent(key)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = key.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage('File downloaded successfully', 'success');
      } else {
        showMessage('Download failed', 'error');
      }
    } catch (error) {
      showMessage(`Download error: ${error}`, 'error');
    }
  };

  // Fájl törlése
  const deleteFile = async (key: string) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showMessage('File deleted successfully', 'success');
        loadFiles(); // Frissítjük a fájllistát
      } else {
        showMessage(`Delete failed: ${data.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Delete error: ${error}`, 'error');
    }
  };

  // Fájl méret formázása
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cloud Storage Test</h1>
        <p className="text-muted-foreground">
          Test your Cloudflare R2 cloud storage connection and file operations
        </p>
      </div>

      {/* Beállítási útmutató */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">⚙️ Cloudflare R2 Beállítási Útmutató</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-blue-700">
          <div>
            <h4 className="font-semibold">1. Cloudflare Dashboard</h4>
            <p className="text-sm">Jelentkezz be → R2 Object Storage → Hozz létre bucket-et</p>
          </div>
          <div>
            <h4 className="font-semibold">2. API Token</h4>
            <p className="text-sm">R2 → Manage R2 API tokens → Create token (Object Read & Write)</p>
          </div>
          <div>
            <h4 className="font-semibold">3. Environment változók (.env)</h4>
            <pre className="text-xs bg-blue-100 p-2 rounded overflow-x-auto">
{`R2_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="[your-access-key-id]"
R2_SECRET_ACCESS_KEY="[your-secret-access-key]"
R2_BUCKET="molino-rental-files"
R2_PUBLIC_URL="https://[your-domain.com]"`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold">4. Server újraindítás</h4>
            <p className="text-sm">A változók frissítése után indítsd újra a development server-t!</p>
          </div>
        </CardContent>
      </Card>

      {/* Üzenet megjelenítése */}
      {message && (
        <Card className={`border-l-4 ${
          messageType === 'success' ? 'border-l-green-500 bg-green-50' :
          messageType === 'error' ? 'border-l-red-500 bg-red-50' :
          'border-l-blue-500 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {messageType === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {messageType === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              {messageType === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
              <span className={`font-medium ${
                messageType === 'success' ? 'text-green-800' :
                messageType === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kapcsolat tesztelése */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Connection Test</span>
          </CardTitle>
          <CardDescription>
            Test your R2 storage connection and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Connection Status:</span>
              {isConnected === null && <Badge variant="outline">Not tested</Badge>}
              {isConnected === true && <Badge className="bg-green-100 text-green-800">Connected</Badge>}
              {isConnected === false && <Badge variant="destructive">Failed</Badge>}
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fájl feltöltés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>File Upload</span>
          </CardTitle>
          <CardDescription>
            Upload a test file to your R2 storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              accept="*/*"
            />
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!uploadFile || isLoading}
            className="w-full"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload File
          </Button>

          {uploadResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Upload Successful!</h4>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>Key:</strong> {uploadResult.key}</p>
                <p><strong>Size:</strong> {formatFileSize(uploadResult.size)}</p>
                <p><strong>URL:</strong> <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="underline">{uploadResult.url}</a></p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fájlok listája */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileIcon className="h-5 w-5" />
            <span>Files in Storage</span>
          </CardTitle>
          <CardDescription>
            Manage files in your test-uploads folder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={loadFiles} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Load Files
          </Button>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.key.split('/').pop()}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file.key)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFile(file.key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found. Upload a file to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}