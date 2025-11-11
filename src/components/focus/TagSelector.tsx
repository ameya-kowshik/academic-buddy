"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Tag as TagIcon, Settings } from "lucide-react";
import { Tag } from "@/lib/focus-utils";

interface TagSelectorProps {
  tags: Tag[];
  selectedTagId?: string | null;
  onSelectTag: (tagId: string | null) => void;
  onManageTags: () => void;
  loading?: boolean;
}

export default function TagSelector({
  tags,
  selectedTagId,
  onSelectTag,
  onManageTags,
  loading = false
}: TagSelectorProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Show first 6 tags by default, with option to show more
  const visibleTags = showAll ? tags : tags.slice(0, 6);
  const hasMoreTags = tags.length > 6;

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TagIcon className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-300">Session Tag</h3>
          </div>
          
          <Button
            onClick={onManageTags}
            disabled={loading}
            size="sm"
            variant="outline"
            className="bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 hover:border-slate-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <Settings className="w-3 h-3 mr-1" />
            Manage
          </Button>
        </div>

        <div className="space-y-3">
          {/* No Tag Option */}
          <button
            onClick={() => onSelectTag(null)}
            disabled={loading}
            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedTagId === null
                ? 'border-slate-500 bg-slate-800/50 text-slate-200'
                : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/30'
            } disabled:opacity-50`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <span className="text-sm">No tag</span>
            </div>
          </button>

          {/* Tag Options */}
          {visibleTags.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {visibleTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onSelectTag(tag.id)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedTagId === tag.id
                      ? 'border-current bg-current/10 text-slate-200'
                      : 'border-slate-700/50 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/30'
                  } disabled:opacity-50`}
                  style={{
                    borderColor: selectedTagId === tag.id ? tag.color : undefined,
                    color: selectedTagId === tag.id ? tag.color : undefined
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    ></div>
                    <span className="text-sm font-medium">{tag.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <TagIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tags created yet</p>
              <p className="text-xs mt-1">Click "Manage" to create your first tag</p>
            </div>
          )}

          {/* Show More/Less Button */}
          {hasMoreTags && (
            <Button
              onClick={() => setShowAll(!showAll)}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="w-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all duration-300"
            >
              {showAll ? `Show Less` : `Show ${tags.length - 6} More`}
            </Button>
          )}
        </div>

        {/* Selected Tag Info */}
        {selectedTagId && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            {(() => {
              const selectedTag = tags.find(tag => tag.id === selectedTagId);
              return selectedTag ? (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-400">Selected:</span>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedTag.color }}
                  ></div>
                  <span 
                    className="font-medium"
                    style={{ color: selectedTag.color }}
                  >
                    {selectedTag.name}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}