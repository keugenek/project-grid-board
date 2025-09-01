import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Board, CreateBoardInput } from '../../../server/src/schema';

interface CreateBoardDialogProps {
  onBoardCreated: (board: Board) => void;
}

export function CreateBoardDialog({ onBoardCreated }: CreateBoardDialogProps) {
  const [formData, setFormData] = useState<CreateBoardInput>({
    name: '',
    description: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const newBoard = await trpc.createBoard.mutate(formData);
      onBoardCreated(newBoard);
      // Reset form
      setFormData({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create New Board</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="board-name">Board Name</Label>
          <Input
            id="board-name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateBoardInput) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter board name..."
            required
          />
        </div>

        <div>
          <Label htmlFor="board-description">Description (optional)</Label>
          <Textarea
            id="board-description"
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateBoardInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            placeholder="Describe the purpose of this board..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? 'Creating...' : 'Create Board'}
        </Button>
      </DialogFooter>
    </form>
  );
}