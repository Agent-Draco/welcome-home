import { useState, useRef } from "react";
import { Paperclip, X, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttachmentButtonProps {
  onAttachment: (url: string, type: 'image' | 'file', name: string) => void;
}

export function AttachmentButton({ onAttachment }: AttachmentButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const isImage = file.type.startsWith('image/');
      onAttachment(publicUrl, isImage ? 'image' : 'file', file.name);

      toast({ title: "File uploaded successfully" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}

interface AttachmentPreviewProps {
  url: string;
  type: 'image' | 'file';
  name: string;
  onRemove: () => void;
}

export function AttachmentPreview({ url, type, name, onRemove }: AttachmentPreviewProps) {
  return (
    <div className="relative inline-flex items-center gap-2 rounded-lg bg-muted p-2 pr-8">
      {type === 'image' ? (
        <div className="relative h-16 w-16 rounded overflow-hidden">
          <img src={url} alt={name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate">{name}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
