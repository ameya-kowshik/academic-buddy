"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Star, 
  Clock, 
  Target,
  X,
  Sparkles
} from "lucide-react";
import { focusUtils } from "@/lib/focus-utils";

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    focusScore?: number;
    notes?: string;
  }) => Promise<void>;
  sessionData: {
    duration: number; // minutes
    sessionType: string;
    startTime: Date;
    endTime: Date;
  };
  loading?: boolean;
}

export default function SessionCompleteModal({
  isOpen,
  onClose,
  onSave,
  sessionData,
  loading = false
}: SessionCompleteModalProps) {
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        focusScore: focusScore || undefined,
        notes: notes.trim() || undefined
      });
      
      // Reset form
      setFocusScore(null);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Failed to save session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Save without rating/notes
    handleSave();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent Focus! 🎯";
    if (score >= 6) return "Good Focus 👍";
    if (score >= 4) return "Fair Focus 😐";
    return "Needs Improvement 😔";
  };

  const motivationalQuote = focusUtils.getMotivationalQuote();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900/95 border-slate-700/50 w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Session Complete! 🎉
          </CardTitle>
          
          <div className="space-y-2 text-slate-400">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{focusUtils.formatDuration(sessionData.duration)}</span>
              <span className="text-slate-500">•</span>
              <span className="capitalize">{sessionData.sessionType.toLowerCase()}</span>
            </div>
            
            <p className="text-sm">
              {sessionData.startTime.toLocaleTimeString()} - {sessionData.endTime.toLocaleTimeString()}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Motivational Quote */}
          <div className="text-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
            <Sparkles className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <blockquote className="text-slate-300 text-sm italic mb-2">
              "{motivationalQuote.text}"
            </blockquote>
            <cite className="text-slate-500 text-xs">— {motivationalQuote.author}</cite>
          </div>

          {/* Focus Score Rating */}
          <div className="space-y-3">
            <Label className="text-slate-300 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              How was your focus? (Optional)
            </Label>
            
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setFocusScore(score)}
                  disabled={saving}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-medium ${
                    focusScore === score
                      ? `${getScoreColor(score)} border-current bg-current/20`
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                  } disabled:opacity-50`}
                >
                  {score}
                </button>
              ))}
            </div>
            
            {focusScore && (
              <div className="text-center">
                <span className={`text-sm font-medium ${getScoreColor(focusScore)}`}>
                  {getScoreLabel(focusScore)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-slate-500">
              <span>Poor Focus</span>
              <span>Excellent Focus</span>
            </div>
          </div>

          {/* Session Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Session Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on? Any insights or distractions?"
              disabled={saving}
              rows={3}
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Session"}
            </Button>
            
            <Button
              onClick={handleSkip}
              disabled={saving || loading}
              variant="outline"
              className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-600 transition-all duration-300 disabled:opacity-50"
            >
              Skip
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Your session data helps improve your productivity insights
          </p>
        </CardContent>
      </Card>
    </div>
  );
}