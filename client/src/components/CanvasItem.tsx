import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText, 
  Code, 
  Lightbulb, 
  Target,
  CheckCircle,
  Clock,
  Eye,
  Archive
} from 'lucide-react';
import { EditItemDialog } from '@/components/EditItemDialog';
import { ItemDetailsDialog } from '@/components/ItemDetailsDialog';
import { trpc } from '@/utils/trpc';
import type { Item, ItemStatus } from '../../../server/src/schema';

interface CanvasItemProps {
  item: Item;
  onUpdate: (item: Item) => void;
  onDelete: (itemId: number) => void;
  onPositionChange: (itemId: number, x: number, y: number) => void;
  scale: number;
}

const statusConfig: Record<ItemStatus, { color: string; icon: React.ReactNode; label: string }> = {
  todo: { 
    color: 'bg-slate-100 text-slate-800 border-slate-200', 
    icon: <FileText className="w-3 h-3" />, 
    label: 'To Do' 
  },
  in_progress: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: <Clock className="w-3 h-3" />, 
    label: 'In Progress' 
  },
  review: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: <Eye className="w-3 h-3" />, 
    label: 'Review' 
  },
  done: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: <CheckCircle className="w-3 h-3" />, 
    label: 'Done' 
  },
  archived: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200', 
    icon: <Archive className="w-3 h-3" />, 
    label: 'Archived' 
  }
};

export function CanvasItem({ item, onUpdate, onDelete, onPositionChange, scale }: CanvasItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return; // Don't start drag on interactive elements
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;
      setDragOffset({ x: deltaX, y: deltaY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && (Math.abs(dragOffset.x) > 5 || Math.abs(dragOffset.y) > 5)) {
      const newX = item.position_x + dragOffset.x;
      const newY = item.position_y + dragOffset.y;
      onPositionChange(item.id, newX, newY);
    }
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDelete = async () => {
    try {
      await trpc.deleteItem.mutate({ id: item.id });
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getItemIcon = () => {
    if (item.xml_content?.includes('<code>')) {
      return <Code className="w-4 h-4 text-purple-600" />;
    }
    if (item.xml_content?.includes('<idea>')) {
      return <Lightbulb className="w-4 h-4 text-yellow-600" />;
    }
    if (item.xml_content?.includes('<task>')) {
      return <Target className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  const itemStyle = {
    position: 'absolute' as const,
    left: `${item.position_x + dragOffset.x}px`,
    top: `${item.position_y + dragOffset.y}px`,
    width: `${item.width}px`,
    minHeight: `${item.height}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 50 : 1,
  };

  const statusInfo = statusConfig[item.status];

  return (
    <>
      <div
        ref={itemRef}
        style={itemStyle}
        className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
          isDragging ? 'shadow-xl scale-105 border-blue-300' : 'border-gray-200'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getItemIcon()}
              <h4 className="font-medium text-gray-900 truncate text-sm">
                {item.title}
              </h4>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowDetails(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShowEdit(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Badge className={`text-xs px-2 py-0.5 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
            <span className="text-xs text-gray-500">
              #{item.id}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {item.description}
            </p>
          )}

          {item.xml_content && (
            <div className="bg-gray-50 rounded p-2 mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Code className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500">XML Data</span>
              </div>
              <pre className="text-xs text-gray-700 font-mono overflow-hidden">
                {item.xml_content.substring(0, 100)}
                {item.xml_content.length > 100 && '...'}
              </pre>
            </div>
          )}

          <div className="text-xs text-gray-400">
            Updated {item.updated_at.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <EditItemDialog 
            item={item} 
            onUpdate={(updatedItem: Item) => {
              onUpdate(updatedItem);
              setShowEdit(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <ItemDetailsDialog item={item} />
        </DialogContent>
      </Dialog>
    </>
  );
}