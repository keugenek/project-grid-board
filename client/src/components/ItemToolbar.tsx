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
import { Plus, FileText, Code, Lightbulb, Target } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Item, CreateItemInput, ItemStatus } from '../../../server/src/schema';

interface ItemToolbarProps {
  boardId: number;
  onItemCreated: (item: Item) => void;
}

export function ItemToolbar({ boardId, onItemCreated }: ItemToolbarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateItemInput>({
    board_id: boardId,
    title: '',
    description: null,
    status: 'todo',
    xml_content: null,
    position_x: Math.random() * 400,
    position_y: Math.random() * 300,
    width: 250,
    height: 200
  });

  const statusOptions: { value: ItemStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'todo', label: 'To Do', icon: <FileText className="w-4 h-4" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Target className="w-4 h-4" /> },
    { value: 'review', label: 'Review', icon: <Lightbulb className="w-4 h-4" /> },
    { value: 'done', label: 'Done', icon: <Plus className="w-4 h-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const newItem = await trpc.createItem.mutate({
        ...formData,
        board_id: boardId
      });
      onItemCreated(newItem);
      
      // Reset form
      setFormData({
        board_id: boardId,
        title: '',
        description: null,
        status: 'todo',
        xml_content: null,
        position_x: Math.random() * 400,
        position_y: Math.random() * 300,
        width: 250,
        height: 200
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleQuickCreate = (title: string, xmlTemplate: string) => {
    const quickItem: CreateItemInput = {
      board_id: boardId,
      title,
      description: null,
      status: 'todo',
      xml_content: xmlTemplate,
      position_x: Math.random() * 400,
      position_y: Math.random() * 300,
      width: 250,
      height: 200
    };

    trpc.createItem.mutate(quickItem)
      .then(onItemCreated)
      .catch((error: Error) => console.error('Failed to create quick item:', error));
  };

  if (!isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Item Tools</h3>
        </div>

        <Button onClick={() => setIsCreating(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create New Item
        </Button>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Quick Templates</h4>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleQuickCreate(
              'Task Item',
              '<task><priority>medium</priority><category>development</category><tags></tags></task>'
            )}
          >
            <FileText className="w-4 h-4 mr-2" />
            Task Item
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleQuickCreate(
              'Idea Note',
              '<idea><category>brainstorm</category><related_items></related_items><metadata></metadata></idea>'
            )}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Idea Note
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleQuickCreate(
              'Code Snippet',
              '<code><language>javascript</language><framework></framework><dependencies></dependencies></code>'
            )}
          >
            <Code className="w-4 h-4 mr-2" />
            Code Snippet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Create Item</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(false)}
        >
          Cancel
        </Button>
      </div>

      <div>
        <Label htmlFor="item-title">Title</Label>
        <Input
          id="item-title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateItemInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter item title..."
          required
        />
      </div>

      <div>
        <Label htmlFor="item-status">Status</Label>
        <Select
          value={formData.status || 'todo'}
          onValueChange={(value: ItemStatus) =>
            setFormData((prev: CreateItemInput) => ({ ...prev, status: value }))
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
        <Label htmlFor="item-description">Description</Label>
        <Textarea
          id="item-description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateItemInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="item-xml">XML Content</Label>
        <Textarea
          id="item-xml"
          value={formData.xml_content || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateItemInput) => ({
              ...prev,
              xml_content: e.target.value || null
            }))
          }
          placeholder="<item><metadata></metadata></item>"
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          XML content for AI processing and advanced visualization
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={!formData.title.trim()}>
        <Plus className="w-4 h-4 mr-2" />
        Create Item
      </Button>
    </form>
  );
}