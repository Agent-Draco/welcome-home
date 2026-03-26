import { useState } from "react";
import { cn } from "@/lib/utils";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Reaction } from "@/hooks/useReactions";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
}

export function MessageReactions({ reactions, onToggle }: MessageReactionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors border",
            r.userReacted
              ? "bg-primary/20 border-primary/40 text-foreground"
              : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100">
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="flex gap-1">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onToggle(emoji); setOpen(false); }}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
