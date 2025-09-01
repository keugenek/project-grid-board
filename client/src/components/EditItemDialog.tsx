import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, CheckCircle, Clock, Eye, Archive } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Item, UpdateItemInput, ItemStatus } from '../../../server/src/schema';

interface EditItemDialogProps {
  item: Item;
  onUpdate: (item: Item) => void;
}

export function EditItemDialog({ item, onUpdate }: EditItemDialogProps) {
  const [formData, setFormData] = useState<UpdateItemInput>({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    xml_content: item.xml_content
  });
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions: { value: ItemStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'todo', label: 'To Do', icon: <FileText className="w-4 h-4" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
    { value: 'review', label: 'Review', icon: <Eye className="w-4 h-4" /> },
    { value: 'done', label: 'Done', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    setIsLoading(true);
    try {
      const updatedItem = await trpc.updateItem.mutate(formData);
      
      // Merge the updated fields with the existing item
      const fullUpdatedItem: Item = {
        ...item,
        title: updatedItem.title || item.title,
        description: formData.description !== undefined ? formData.description : item.description,
        status: formData.status || item.status,
        xml_content: formData.xml_content !== undefined ? formData.xml_content : item.xml_content,
        updated_at: new Date()
      };
      
      onUpdate(fullUpdatedItem);
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Item</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            value={formData.title || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: UpdateItemInput) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter item title..."
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-status">Status</Label>
          <Select
            value={formData.status || item.status}
            onValueChange={(value: ItemStatus) =>
              setFormData((prev: UpdateItemInput) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: UpdateItemInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            placeholder="Optional description..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="edit-xml">XML Content</Label>
          <Textarea
            id="edit-xml"
            value={formData.xml_content || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: UpdateItemInput) => ({
                ...prev,
                xml_content: e.target.value || null
              }))
            }
            placeholder="<item><metadata></metadata></item>"
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            XML content for AI processing and advanced visualization
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading || !formData.title?.trim()}>
          {isLoading ? 'Updating...' : 'Update Item'}
        </Button>
      </DialogFooter>
    </form>
  );
}