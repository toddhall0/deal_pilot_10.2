"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pin, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotes, useNoteMutations } from "@/hooks/use-notes";
import { useToast } from "@/hooks/use-toast";

interface NotesTabProps {
  dealId: string;
}

export function NotesTab({ dealId }: NotesTabProps) {
  const { data: notes, isLoading } = useNotes(dealId);
  const { create } = useNoteMutations(dealId);
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
  });

  const handleCreate = async () => {
    if (!newNote.content.trim()) {
      toast({ title: "Error", description: "Note content is required", variant: "destructive" });
      return;
    }

    try {
      await create.mutateAsync({
        title: newNote.title || undefined,
        content: newNote.content,
      });
      toast({ title: "Success", description: "Note created successfully" });
      setShowCreateDialog(false);
      setNewNote({ title: "", content: "" });
    } catch {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Notes and comments for this deal</CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>Add a note or comment to this deal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!notes || notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No notes yet. Add your first note to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={note.author.avatar || undefined} />
                      <AvatarFallback>
                        {note.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{note.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      {note.title && (
                        <h4 className="font-medium mt-1">{note.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
