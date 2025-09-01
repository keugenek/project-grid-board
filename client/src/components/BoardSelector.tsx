import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { Board } from '../../../server/src/schema';

interface BoardSelectorProps {
  boards: Board[];
  selectedBoard: Board | null;
  onBoardSelect: (board: Board) => void;
}

export function BoardSelector({ boards, selectedBoard, onBoardSelect }: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBoardSelect = (board: Board) => {
    onBoardSelect(board);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between min-w-[200px]">
          <span className="truncate">
            {selectedBoard ? selectedBoard.name : 'Select a board...'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {boards.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-gray-500">No boards available</div>
        ) : (
          boards.map((board: Board) => (
            <DropdownMenuItem
              key={board.id}
              onSelect={() => handleBoardSelect(board)}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{board.name}</span>
                {board.description && (
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">
                    {board.description}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}