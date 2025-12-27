import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "./EmojiPicker";
import { AttachmentButton, AttachmentPreview } from "./AttachmentButton";

interface Attachment {
  url: string;
  type: 'image' | 'file';
  name: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  placeholder?: string;
}

export function ChatInput({ onSend, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleAttachment = (url: string, type: 'image' | 'file', name: string) => {
    setAttachments(prev => [...prev, { url, type, name }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border bg-surface">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 pb-0">
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={index}
              url={attachment.url}
              type={attachment.type}
              name={attachment.name}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 p-4">
        <AttachmentButton onAttachment={handleAttachment} />
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-full border-border bg-background px-4 py-2 focus-visible:ring-primary"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() && attachments.length === 0}
          className="shrink-0 rounded-full shadow-glow-primary transition-all duration-200 hover:scale-105 disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
