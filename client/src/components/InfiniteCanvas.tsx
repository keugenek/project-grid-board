import { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasItem } from '@/components/CanvasItem';
import { trpc } from '@/utils/trpc';
import type { Item } from '../../../server/src/schema';

interface InfiniteCanvasProps {
  items: Item[];
  isLoading: boolean;
  onItemUpdate: (item: Item) => void;
  onItemDelete: (itemId: number) => void;
}

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export function InfiniteCanvas({ items, isLoading, onItemUpdate, onItemDelete }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  // Handle canvas panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLastPan({ x: viewState.x, y: viewState.y });
    }
  }, [viewState.x, viewState.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setViewState((prev: ViewState) => ({
        ...prev,
        x: lastPan.x + deltaX,
        y: lastPan.y + deltaY
      }));
    }
  }, [isDragging, dragStart.x, dragStart.y, lastPan.x, lastPan.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState((prev: ViewState) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta))
    }));
  }, []);

  // Handle item position updates
  const handleItemDrag = async (itemId: number, newX: number, newY: number) => {
    try {
      await trpc.updateItemPosition.mutate({
        id: itemId,
        position_x: newX,
        position_y: newY
      });
      
      // Find the full item to update with new position
      const fullItem = items.find((item: Item) => item.id === itemId);
      if (fullItem) {
        onItemUpdate({
          ...fullItem,
          position_x: newX,
          position_y: newY
        });
      }
    } catch (error) {
      console.error('Failed to update item position:', error);
    }
  };

  // Add event listeners for global mouse events
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setViewState((prev: ViewState) => ({
          ...prev,
          x: lastPan.x + deltaX,
          y: lastPan.y + deltaY
        }));
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, dragStart.x, dragStart.y, lastPan.x, lastPan.y]);

  const canvasStyle = {
    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
    transformOrigin: '0 0'
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewState.scale}px ${20 * viewState.scale}px`,
          backgroundPosition: `${viewState.x % (20 * viewState.scale)}px ${viewState.y % (20 * viewState.scale)}px`
        }}
      />

      {/* Canvas controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 z-10">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setViewState({ x: 0, y: 0, scale: 1 })}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Reset View
          </button>
          <span>Zoom: {Math.round(viewState.scale * 100)}%</span>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={canvasStyle}
        >
          {items.map((item: Item) => (
            <CanvasItem
              key={item.id}
              item={item}
              onUpdate={onItemUpdate}
              onDelete={onItemDelete}
              onPositionChange={handleItemDrag}
              scale={viewState.scale}
            />
          ))}

          {items.length === 0 && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Canvas</h3>
                <p className="text-gray-600 max-w-xs">
                  Start creating items using the toolbar on the left. 
                  Use templates or create custom items with XML content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}