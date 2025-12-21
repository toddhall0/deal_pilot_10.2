"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFolderMutations } from "@/hooks/use-document-folders";
import { useToast } from "@/hooks/use-toast";

interface CreateFolderDialogProps {
  dealId: string;
  parentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({
  dealId,
  parentId,
  open,
  onOpenChange,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createFolder } = useFolderMutations(dealId);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createFolder.mutateAsync({
        name: name.trim(),
        parentId: parentId || undefined,
        description: description.trim() || undefined,
      });
      toast({
        title: "Folder created",
        description: `"${name}" has been created successfully.`,
      });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
