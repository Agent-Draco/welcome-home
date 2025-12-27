import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { File, Download, Pin } from "lucide-react";
import { PinMessageButton } from "./PinMessageButton";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      initials: string;
      color: string;
      avatar_url?: string;
    };
    timestamp: Date;
    isOwn?: boolean;
    isPinned?: boolean;
  };
  onPinChange?: () => void;
}

// Parse message content for attachments
function parseContent(content: string) {
  const imageRegex = /\[image:(https?:\/\/[^\]]+)\]/g;
  const fileRegex = /\[file:([^:]+):(https?:\/\/[^\]]+)\]/g;
  
  const images: string[] = [];
  const files: { name: string; url: string }[] = [];
  
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  while ((match = fileRegex.exec(content)) !== null) {
    files.push({ name: match[1], url: match[2] });
  }
  
  // Remove attachment tags from text
  const text = content
    .replace(imageRegex, '')
    .replace(fileRegex, '')
    .trim();
  
  return { text, images, files };
}

export function ChatMessage({ message, onPinChange }: ChatMessageProps) {
  const isOwn = message.isOwn;
  const { text, images, files } = parseContent(message.content);

  return (
    <div
      className={cn(
        "group flex gap-3 animate-slide-up relative",
        isOwn ? "flex-row-reverse" : "flex-row",
        message.isPinned && "bg-primary/5 -mx-4 px-4 py-2 rounded-lg border-l-2 border-primary"
      )}
    >
      <Avatar className="h-9 w-9 shrink-0 shadow-sm">
        {message.sender.avatar_url && (
          <AvatarImage src={message.sender.avatar_url} alt={message.sender.name} />
        )}
        <AvatarFallback className={cn("text-sm font-semibold", message.sender.color)}>
          {message.sender.initials}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[70%] flex-col gap-1", isOwn && "items-end")}>
        <div className="flex items-center gap-2">
          {message.isPinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
          <span className="text-sm font-medium text-foreground">
            {message.sender.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, "h:mm a")}
          </span>
          <PinMessageButton 
            messageId={message.id} 
            isPinned={!!message.isPinned}
            onPinChange={onPinChange}
          />
        </div>
        
        {/* Images */}
        {images.length > 0 && (
          <div className={cn("flex flex-wrap gap-2", isOwn && "justify-end")}>
            {images.map((url, index) => (
              <a 
                key={index} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-border"
              >
                <img 
                  src={url} 
                  alt="Attachment" 
                  className="max-h-48 max-w-full object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
        
        {/* Files */}
        {files.length > 0 && (
          <div className={cn("flex flex-col gap-1", isOwn && "items-end")}>
            {files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isOwn
                    ? "bg-primary/80 text-primary-foreground hover:bg-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <File className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <Download className="h-3 w-3 opacity-60" />
              </a>
            ))}
          </div>
        )}
        
        {/* Text content */}
        {text && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 shadow-sm",
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card text-card-foreground border border-border rounded-tl-sm"
            )}
          >
            <p className="text-sm leading-relaxed">{text}</p>
          </div>
        )}
      </div>
    </div>
  );
}