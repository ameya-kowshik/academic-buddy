"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentList from "@/components/documents/DocumentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  extractedText: string | null;
  tags: string[];
  uploadedAt: string;
  processedAt: string | null;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get Firebase token for authentication
      const token = await user.getIdToken();
      
      const response = await fetch("/api/documents", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleUploadComplete = () => {
    fetchDocuments();
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;
    
    try {
      console.log('[DocumentsPage] Starting deletion for document:', documentId);
      
      // Get Firebase token for authentication
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[DocumentsPage] Response status:', response.status);
      console.log('[DocumentsPage] Response ok:', response.ok);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('[DocumentsPage] Error response:', errorData);
        } catch (e) {
          console.error('[DocumentsPage] Could not parse error response');
          errorData = {};
        }
        const errorMessage = errorData.error || errorData.details || "Failed to delete document";
        console.error('[DocumentsPage] Delete failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('[DocumentsPage] Document deleted successfully');
      setError(null); // Clear any previous errors
      await fetchDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete document";
      console.error('[DocumentsPage] Error:', errorMessage);
      setError(errorMessage);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Study Documents</h1>
                <p className="text-sm text-slate-400">Upload and manage your study materials</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-6xl">
          {error && (
            <Card className="bg-red-500/10 border-red-500/20 mb-6">
              <CardContent className="p-4">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Upload Document</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload 
                  userId={user.uid}
                  user={user}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(error) => setError(error)}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Your Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No documents yet. Upload your first study material!</p>
                  </div>
                ) : (
                  <DocumentList 
                    documents={documents}
                    onDelete={handleDelete}
                    onRefresh={fetchDocuments}
                    isLoading={loading}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
