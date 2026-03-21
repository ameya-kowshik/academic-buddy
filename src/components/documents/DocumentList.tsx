"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AIFlashcardGenerator from "./AIFlashcardGenerator";
import AIQuizGenerator from "./AIQuizGenerator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function DocumentList({
  documents,
  onDelete,
  onRefresh,
  isLoading = false,
}: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExtractionStatus = (doc: Document) => {
    if (!doc.processedAt) {
      return {
        icon: Clock,
        label: "Processing",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      };
    }
    if (doc.extractedText) {
      return {
        icon: CheckCircle2,
        label: "Text Extracted",
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
      };
    }
    return {
      icon: XCircle,
      label: "Extraction Failed",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    };
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete || !onDelete) return;

    setDeletingId(documentToDelete);
    try {
      console.log('[DocumentList] Starting deletion for document:', documentToDelete);
      await onDelete(documentToDelete);
      console.log('[DocumentList] Deletion successful');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      onRefresh?.();
    } catch (error) {
      console.error('[DocumentList] Error deleting document:', error);
      // Error will be shown by the parent component
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-300 font-medium text-lg mb-2">
            No documents yet
          </h3>
          <p className="text-slate-500 text-sm">
            Upload your first PDF document to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {documents.map((doc) => {
          const status = getExtractionStatus(doc);
          const StatusIcon = status.icon;

          return (
            <Card
              key={doc.id}
              className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-slate-200 font-medium text-lg truncate">
                        {doc.fileName}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                          className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(doc.id)}
                          disabled={deletingId === doc.id}
                          className="text-slate-400 hover:text-red-400 hover:bg-slate-800/60"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span className="text-slate-600">•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>

                    {/* Extraction Status */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                        status.bgColor,
                        status.borderColor
                      )}
                    >
                      <StatusIcon className={cn("w-4 h-4", status.color)} />
                      <span className={cn("text-sm font-medium", status.color)}>
                        {status.label}
                      </span>
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {doc.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-slate-800/40 border-slate-600/50 text-slate-300 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* AI Generation Buttons */}
                    {doc.extractedText && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <AIFlashcardGenerator
                          documentId={doc.id}
                          documentName={doc.fileName}
                          hasExtractedText={!!doc.extractedText}
                        />
                        <AIQuizGenerator
                          documentId={doc.id}
                          documentName={doc.fileName}
                          hasExtractedText={!!doc.extractedText}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this document? This action cannot
              be undone. Any flashcards or quizzes linked to this document will
              remain but will no longer reference the source material.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800/40 border-slate-600/50 text-slate-200 hover:bg-slate-800/60 hover:text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
