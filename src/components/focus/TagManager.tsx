"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Palette,
  Tag as TagIcon,
  Save,
  AlertCircle
} from "lucide-react";
import { Tag, focusUtils } from "@/lib/focus-utils";

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (data: { name: string; color: string }) => Promise<void>;
  onUpdateTag: (tagId: string, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
  loading?: boolean;
}

export default function TagManager({
  isOpen,
  onClose,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  loading = false
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(focusUtils.generateRandomColor());
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const predefinedColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#6366f1', '#84cc16'
  ];

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError("Tag name is required");
      return;
    }

    try {
      setActionLoading("create");
      setError("");
      await onCreateTag({
        name: newTagName.trim(),
        color: newTagColor
      });
      setNewTagName("");
      setNewTagColor(focusUtils.generateRandomColor());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError("");
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editName.trim()) {
      setError("Tag name is required");
      return;
    }

    try {
      setActionLoading(`update-${editingTag.id}`);
      setError("");
      await onUpdateTag(editingTag.id, {
        name: editName.trim(),
        color: editColor
      });
      setEditingTag(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return;
    }

    try {
      setActionLoading(`delete-${tag.id}`);
      setError("");
      await onDeleteTag(tag.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditName("");
    setEditColor("");
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900/95 border-slate-700/50 w-full max-w-2xl mx-auto max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <TagIcon className="w-5 h-5 mr-2" />
              Manage Tags
            </CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Create New Tag */}
          <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-200">Create New Tag</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tagName" className="text-slate-300">Tag Name</Label>
                <Input
                  id="tagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  disabled={actionLoading === "create" || loading}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded border-2 border-slate-600"
                    style={{ backgroundColor: newTagColor }}
                  ></div>
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    disabled={actionLoading === "create" || loading}
                    className="w-16 h-8 p-0 border-slate-700/50 bg-slate-900/50"
                  />
                </div>
              </div>
            </div>

            {/* Predefined Colors */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Quick Colors</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    disabled={actionLoading === "create" || loading}
                    className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                      newTagColor === color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-500'
                    } disabled:opacity-50`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || actionLoading === "create" || loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {actionLoading === "create" ? "Creating..." : "Create Tag"}
            </Button>
          </div>

          {/* Existing Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">
              Existing Tags ({tags.length})
            </h3>

            {tags.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <TagIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tags created yet</p>
                <p className="text-sm mt-1">Create your first tag above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                  >
                    {editingTag?.id === tag.id ? (
                      // Edit Mode
                      <div className="flex-1 flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded border border-slate-600"
                          style={{ backgroundColor: editColor }}
                        ></div>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={actionLoading?.startsWith("update") || loading}
                          className="flex-1 bg-slate-900/50 border-slate-700/50 text-white text-sm"
                        />
                        <Input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          disabled={actionLoading?.startsWith("update") || loading}
                          className="w-12 h-8 p-0 border-slate-700/50 bg-slate-900/50"
                        />
                        <div className="flex space-x-1">
                          <Button
                            onClick={handleUpdateTag}
                            disabled={!editName.trim() || actionLoading?.startsWith("update") || loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-500 text-white"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            disabled={actionLoading?.startsWith("update") || loading}
                            size="sm"
                            variant="outline"
                            className="bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-500 transition-all duration-300"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className="text-slate-200 font-medium">{tag.name}</span>
                          <span className="text-slate-500 text-sm">
                            ({(tag as any)._count?.pomodoroLogs || 0} sessions)
                          </span>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => handleEditTag(tag)}
                            disabled={actionLoading !== null || loading}
                            size="sm"
                            variant="outline"
                            className="bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTag(tag)}
                            disabled={actionLoading !== null || loading}
                            size="sm"
                            variant="outline"
                            className="bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
                          >
                            {actionLoading === `delete-${tag.id}` ? (
                              "..."
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}