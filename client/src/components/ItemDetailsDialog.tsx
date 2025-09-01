import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Code, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  Clock, 
  Eye, 
  Archive,
  Calendar,
  Hash,
  MapPin,
  Maximize2
} from 'lucide-react';
import type { Item, ItemStatus } from '../../../server/src/schema';

interface ItemDetailsDialogProps {
  item: Item;
}

const statusConfig: Record<ItemStatus, { color: string; icon: React.ReactNode; label: string }> = {
  todo: { 
    color: 'bg-slate-100 text-slate-800 border-slate-200', 
    icon: <FileText className="w-4 h-4" />, 
    label: 'To Do' 
  },
  in_progress: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: <Clock className="w-4 h-4" />, 
    label: 'In Progress' 
  },
  review: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: <Eye className="w-4 h-4" />, 
    label: 'Review' 
  },
  done: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: <CheckCircle className="w-4 h-4" />, 
    label: 'Done' 
  },
  archived: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200', 
    icon: <Archive className="w-4 h-4" />, 
    label: 'Archived' 
  }
};

export function ItemDetailsDialog({ item }: ItemDetailsDialogProps) {
  const statusInfo = statusConfig[item.status];

  const getItemIcon = () => {
    if (item.xml_content?.includes('<code>')) {
      return <Code className="w-5 h-5 text-purple-600" />;
    }
    if (item.xml_content?.includes('<idea>')) {
      return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    }
    if (item.xml_content?.includes('<task>')) {
      return <Target className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const formatXML = (xml: string) => {
    try {
      // Basic XML formatting - add proper indentation
      return xml
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '')
        .split('\n')
        .map((line) => {
          const depth = (line.match(/^<[^/]/) ? 0 : -1) + (line.match(/</g) || []).length - (line.match(/\//g) || []).length;
          return '  '.repeat(Math.max(0, depth)) + line;
        })
        .join('\n');
    } catch {
      return xml;
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-start gap-3">
          {getItemIcon()}
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl">{item.title}</DialogTitle>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`${statusInfo.color}`}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Hash className="w-3 h-3" />
                {item.id}
              </div>
            </div>
          </div>
        </div>
      </DialogHeader>

      <Separator />

      {/* Description */}
      {item.description && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Metadata</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Position:</span>
              <span className="font-mono">({item.position_x}, {item.position_y})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Size:</span>
              <span className="font-mono">{item.width} × {item.height}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Timestamps</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Created:</span>
              <span>{item.created_at.toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Updated:</span>
              <span>{item.updated_at.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XML Content */}
      {item.xml_content && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Code className="w-4 h-4" />
              XML Content
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(item.xml_content || '')}
            >
              Copy XML
            </Button>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
              {formatXML(item.xml_content)}
            </pre>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            This XML content can be processed by AI agents for updates and visualization
          </p>
        </div>
      )}

      {/* API Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">API Access</h4>
        <p className="text-sm text-blue-800 mb-3">
          This item can be accessed and modified by AI agents through the tRPC API:
        </p>
        <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs text-gray-700">
          <div>GET: <code>getItem(&#123;id: {item.id}&#125;)</code></div>
          <div>PUT: <code>updateItem(&#123;id: {item.id}, ...changes&#125;)</code></div>
          <div>DEL: <code>deleteItem(&#123;id: {item.id}&#125;)</code></div>
        </div>
      </div>
    </div>
  );
}