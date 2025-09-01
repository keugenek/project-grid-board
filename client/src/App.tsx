import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Folders, Settings } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { BoardSelector } from '@/components/BoardSelector';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { InfiniteCanvas } from '@/components/InfiniteCanvas';
import { ItemToolbar } from '@/components/ItemToolbar';
import type { Board, Item } from '../../server/src/schema';

function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  // Load all boards on app start
  const loadBoards = useCallback(async () => {
    try {
      const result = await trpc.getBoards.query();
      setBoards(result);
      // Auto-select first board if none selected
      if (result.length > 0 && !selectedBoard) {
        setSelectedBoard(result[0]);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  }, [selectedBoard]);

  // Load items for the selected board
  const loadItems = useCallback(async () => {
    if (!selectedBoard) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getItemsByBoard.query({ board_id: selectedBoard.id });
      setItems(result);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBoard]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleBoardCreated = (newBoard: Board) => {
    setBoards((prev: Board[]) => [...prev, newBoard]);
    setSelectedBoard(newBoard);
    setShowCreateBoard(false);
  };

  const handleBoardSelect = (board: Board) => {
    setSelectedBoard(board);
  };

  const handleItemCreated = (newItem: Item) => {
    setItems((prev: Item[]) => [...prev, newItem]);
  };

  const handleItemUpdated = (updatedItem: Item) => {
    setItems((prev: Item[]) => 
      prev.map((item: Item) => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  const handleItemDeleted = (itemId: number) => {
    setItems((prev: Item[]) => prev.filter((item: Item) => item.id !== itemId));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">🎯 CollabCanvas</h1>
          
          <div className="flex items-center gap-2">
            <Folders className="w-4 h-4 text-gray-500" />
            <BoardSelector
              boards={boards}
              selectedBoard={selectedBoard}
              onBoardSelect={handleBoardSelect}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateBoardDialog onBoardCreated={handleBoardCreated} />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {selectedBoard ? (
          <>
            {/* Toolbar */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
              <ItemToolbar
                boardId={selectedBoard.id}
                onItemCreated={handleItemCreated}
              />
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              <InfiniteCanvas
                items={items}
                isLoading={isLoading}
                onItemUpdate={handleItemUpdated}
                onItemDelete={handleItemDeleted}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Folders className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Board Selected</h3>
              <p className="text-gray-600 mb-4">Create a new board to get started with your collaborative workspace.</p>
              <Button onClick={() => setShowCreateBoard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Board
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;