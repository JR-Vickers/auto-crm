import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Plus, Trash } from "lucide-react";

interface Template {
  id: string;
  title: string;
  content: string;
}

interface QuickResponseTemplatesProps {
  templates: Template[];
  onSelect: (content: string) => void;
  onSave: (template: Omit<Template, "id">) => void;
  onDelete: (id: string) => void;
}

export function QuickResponseTemplates({
  templates,
  onSelect,
  onSave,
  onDelete,
}: QuickResponseTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title, content });
    setTitle("");
    setContent("");
    setIsOpen(false);
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Templates
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <ScrollArea className="h-[300px]">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between"
                onSelect={() => onSelect(template.content)}
              >
                <span className="truncate">{template.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Response Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for common responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Request More Information"
              />
            </div>
            <div className="space-y-2">
              <Label>Template Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your template content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 