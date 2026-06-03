import { useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";

const PRESET_TAGS = [
  { label: "High Potential", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "In Progress",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Researching",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Validated",      color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "On Hold",        color: "bg-rose-100 text-rose-700 border-rose-200" },
];

const getTagColor = (label) =>
  PRESET_TAGS.find((t) => t.label === label)?.color ||
  "bg-muted text-muted-foreground border-border";

export default function TagSelector({ savedId, currentTags = [], onTagsChange }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTag = async (label) => {
    const updated = currentTags.includes(label)
      ? currentTags.filter((t) => t !== label)
      : [...currentTags, label];

    setSaving(true);
    const { error } = await supabase
      .from("saved_ideas")
      .update({ tags: updated })
      .eq("id", savedId);
    setSaving(false);

    if (error) {
      toast.error("Failed to update tags.");
    } else {
      onTagsChange(updated);
    }
  };

  return (
    <div className="mt-3">
      {/* Active tags display */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {currentTags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTagColor(tag)}`}
          >
            {tag}
            <button
              onClick={() => toggleTag(tag)}
              className="hover:opacity-70 transition-opacity"
              disabled={saving}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Add tag button */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {currentTags.length === 0 ? "Add tag" : ""}
        </button>
      </div>

      {/* Tag picker dropdown */}
      {open && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-muted/40 animate-in fade-in slide-in-from-top-1 duration-150">
          {PRESET_TAGS.map((tag) => {
            const isActive = currentTags.includes(tag.label);
            return (
              <button
                key={tag.label}
                onClick={() => toggleTag(tag.label)}
                disabled={saving}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-150
                  ${isActive
                    ? `${tag.color} opacity-50 line-through`
                    : `${tag.color} hover:opacity-80`
                  }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
