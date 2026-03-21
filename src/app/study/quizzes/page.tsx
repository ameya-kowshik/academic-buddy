"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import QuizList from "@/components/quizzes/QuizList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  grouping: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sourceMaterialId: string | null;
  sourceMaterial?: {
    id: string;
    fileName: string;
  } | null;
  _count?: {
    questions: number;
    attempts: number;
  };
}

export default function QuizzesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      const response = await fetch("/api/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const handleDelete = async (quizId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }
      
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
    }
  };

  const handleTakeQuiz = (quizId: string) => {
    router.push(`/study/quizzes/${quizId}/take`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Quizzes</h1>
                <p className="text-sm text-slate-400">Test your knowledge</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/study/quizzes/new")}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Quiz
            </Button>
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

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-100">Your Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">No quizzes yet. Create your first one!</p>
                  <Button
                    onClick={() => router.push("/study/quizzes/new")}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                </div>
              ) : (
                <QuizList
                  quizzes={quizzes}
                  onDelete={handleDelete}
                  onTakeQuiz={handleTakeQuiz}
                  onRefresh={fetchQuizzes}
                  isLoading={loading}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}
