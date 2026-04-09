"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import FlashcardReview from "@/components/flashcards/FlashcardReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, FileText, Loader2, BookOpen, ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface Flashcard {
  id: string;
  title: string;
  question: string;
  answer: string;
  grouping: string | null;
  difficulty: number;
  tags: string[];
  reviewCount: number;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sourceMaterialId: string | null;
  sourceMaterial?: {
    id: string;
    fileName: string;
  } | null;
}

interface Document {
  id: string;
  fileName: string;
  flashcardCount: number;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      const response = await fetch("/api/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      
      const data = await response.json();
      
      // Get flashcard counts for each document
      const docsWithCounts = await Promise.all(
        (data.documents || []).map(async (doc: any) => {
          const flashcardsRes = await fetch(`/api/flashcards?sourceMaterialId=${doc.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const flashcardsData = await flashcardsRes.json();
          return {
            id: doc.id,
            fileName: doc.fileName,
            flashcardCount: flashcardsData.flashcards?.length || 0,
          };
        })
      );
      
      setDocuments(docsWithCounts.filter(doc => doc.flashcardCount > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcards = async (documentId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      const response = await fetch(`/api/flashcards?sourceMaterialId=${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }
      
      const data = await response.json();
      setFlashcards(data.flashcards || []);
      setReviewMode(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    fetchFlashcards(doc.id);
  };

  const handleReview = async (flashcardId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      await fetch(`/api/flashcards/${flashcardId}/review`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to record review:", err);
    }
  };

  const handleDeleteFlashcard = async (flashcardId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/flashcards/${flashcardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh the current view
      if (selectedDocument) {
        fetchFlashcards(selectedDocument.id);
      } else {
        fetchDocuments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flashcard");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      // Fetch all flashcards for this doc and delete them
      const res = await fetch(`/api/flashcards?sourceMaterialId=${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await Promise.all(
          (data.flashcards || []).map((fc: { id: string }) =>
            fetch(`/api/flashcards/${fc.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flashcards");
    }
  };

  const handleExitReview = () => {
    setReviewMode(false);
    setSelectedDocument(null);
    setFlashcards([]);
    fetchDocuments();
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">
                  {reviewMode ? "Review Flashcards" : "Flashcards"}
                </h1>
                <p className="text-sm text-slate-400">
                  {reviewMode
                    ? `Reviewing: ${selectedDocument?.fileName}`
                    : "Select a document to review flashcards"}
                </p>
              </div>
            </div>
            {reviewMode && (
              <Button
                onClick={handleExitReview}
                variant="outline"
                className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documents
              </Button>
            )}
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

          {reviewMode ? (
            <FlashcardReview
              flashcards={flashcards}
              onReview={handleReview}
              onExit={handleExitReview}
              getToken={() => user?.getIdToken() ?? Promise.resolve(null)}
            />
          ) : (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Your Documents with Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No flashcards available yet</p>
                    <p className="text-slate-500 text-sm mb-6">
                      Upload a document and generate flashcards using AI
                    </p>
                    <Button
                      onClick={() => window.location.href = "/study/documents"}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Go to Documents
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card
                        key={doc.id}
                        className="bg-slate-800/40 border-slate-700/50 hover:border-violet-500/50 transition-all cursor-pointer group"
                        onClick={() => handleSelectDocument(doc)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                              <FileText className="w-6 h-6 text-violet-400" />
                            </div>
                            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                              {doc.flashcardCount} cards
                            </Badge>
                          </div>
                          <h3 className="text-slate-200 font-medium mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                            {doc.fileName}
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white"
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
                              onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
