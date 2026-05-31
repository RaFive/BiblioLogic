/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookBlock, Color } from '../types';
import { RotateCw, Sparkles } from 'lucide-react';

interface InventoryProps {
  inventory: BookBlock[];
  selectedBlockId: string | null;
  selectBlock: (id: string | null) => void;
  rotateBlock: (id: string) => void;
}

// Background colors for the miniature inventory block shapes
const COLOR_CLASSES: Record<Color, string> = {
  red: 'bg-rose-500 shadow-rose-900/20 border-rose-600',
  blue: 'bg-indigo-500 shadow-indigo-900/20 border-indigo-600',
  green: 'bg-emerald-500 shadow-emerald-950/20 border-emerald-600',
  yellow: 'bg-amber-400 shadow-amber-900/20 border-amber-500'
};

export default function Inventory({
  inventory,
  selectedBlockId,
  selectBlock,
  rotateBlock
}: InventoryProps) {

  // Function to calculate grid footprint bounds and draw small 2D preview
  const renderShapePreview = (block: BookBlock) => {
    // Collect coordinates
    const xs = block.shape.map(p => p.x);
    const ys = block.shape.map(p => p.y);
    const zs = block.shape.map(p => p.z);

    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 0);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 0);
    const minZ = Math.min(...zs, 0);
    const maxZ = Math.max(...zs, 0);

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    // Normalizing grid layout size
    const gridSize = Math.max(w, h, 2); // At least 2x2 grid size

    const rows = [];
    for (let currentY = 0; currentY < gridSize; currentY++) {
      const rowCells = [];
      for (let currentX = 0; currentX < gridSize; currentX++) {
        // Shift check coordinates back relative to shape pivot
        const targetX = currentX + minX;
        const targetY = currentY + minY;

        // Check if there is any cell in block.shape matching this X, Y position
        const shapeNode = block.shape.find(p => p.x === targetX && p.y === targetY);
        
        rowCells.push(
        <div
          key={`mini_${currentX}_${currentY}`}
          className={`w-[11px] h-[11px] sm:w-[18px] sm:h-[18px] xl:w-[14px] xl:h-[14px] rounded-[2px] sm:rounded-[3px] xl:rounded-[2px] border-b-[1px] sm:border-b-[1.5px] xl:border-b-[1px] transition-all duration-300
            ${shapeNode 
              ? `${COLOR_CLASSES[block.color]} border-black/25 relative` 
              : 'bg-neutral-100/40 border-dashed border-[1px] border-neutral-300/20'}
          `}
        >
          {/* If there is stacking height (Z-stack), show tiny layered lines */}
          {shapeNode && shapeNode.z > 0 && (
            <div className="absolute inset-0 border-t border-r border-white/50 rounded-[2px] opacity-80" />
          )}
        </div>
      );
    }
    rows.push(
      <div key={`mini_row_${currentY}`} className="flex gap-0.5 sm:gap-1 xl:gap-0.5">
        {rowCells}
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-0.5 sm:gap-1 xl:gap-0.5 p-1 sm:p-2 xl:p-1 bg-[#FAF7F2] rounded-md sm:rounded-lg border border-[#E9DFCE]/60 shadow-inner select-none"
      style={{ transform: 'rotate(0deg)' }}
    >
      {rows}
    </div>
  );
};

  return (
    <div id="inventory-section" className="w-full select-none bg-[#FDFBF7]/50 rounded border border-stone-300 p-3 sm:p-4 xl:p-2 shadow-sm max-w-[540px] xl:max-w-[480px] flex-none z-20">
      
      {/* Inventory Header */}
      <div className="flex justify-between items-center mb-1.5 sm:mb-3 xl:mb-1">
        <h3 className="font-sans font-semibold text-[10px] sm:text-xs tracking-wider text-stone-500 uppercase flex items-center gap-1 sm:gap-1.5">
          <Sparkles size={11} className="text-stone-400 animate-pulse" />
          BUKU TAK TERSUSUN ({inventory.length})
        </h3>
      </div>

      {inventory.length === 0 ? (
        // Empty state
        <div 
          id="inventory-empty"
          className="flex flex-col items-center justify-center p-4 sm:p-8 xl:p-4 bg-stone-100/60 rounded border border-dashed border-stone-300 text-center"
        >
          <p className="text-[10px] sm:text-xs xl:text-[10px] text-stone-600 font-semibold font-sans">
            Semua buku sudah ditata di dalam kardus! 🎉
          </p>
          <p className="text-[9px] sm:text-[10px] xl:text-[9px] text-stone-400 mt-1 font-sans">
            Periksa Cetak Biru untuk mencocokkan pola akhir.
          </p>
        </div>
      ) : (
        // Active inventory blocks list
        <div 
          id="inventory-grid"
          className="grid grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3 xl:gap-1.5"
        >
          {inventory.map(block => {
            const isSelected = block.id === selectedBlockId;

            return (
              <div
                key={block.id}
                id={`inventory-card-${block.id}`}
                onClick={() => selectBlock(block.id)}
                className={`relative group bg-[#FDFBF7] hover:bg-[#FDFCF9] border rounded p-1.5 sm:p-3 xl:p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 transform select-none hover:-translate-y-0.5 active:scale-95
                  ${isSelected 
                    ? 'border-stone-500 ring-2 ring-stone-900/5 shadow-md bg-stone-100/40' 
                    : 'border-stone-300 hover:border-stone-400 shadow-sm'}
                `}
                style={{ contentVisibility: 'auto' }}
                title="Pilih buku dalam tas penyimpanan"
              >
                {/* Active Selection Bookmark Ribbon */}
                {isSelected && (
                  <div className="absolute top-0 left-2 w-2.5 h-4 bg-amber-500 border-x border-b border-amber-600 rounded-b shadow-sm z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-0.5 h-1 bg-amber-700/40 rounded-full" />
                  </div>
                )}

                {/* Block preview footprint */}
                <div className="my-1 sm:my-2 xl:my-0.5 flex items-center justify-center">
                  {renderShapePreview(block)}
                </div>

                {/* Sub-card controller panel */}
                <div className="w-full flex justify-center items-center mt-1 sm:mt-2 xl:mt-1 pt-1 sm:pt-2 xl:pt-1 border-t border-stone-200">
                  <span className="text-[8px] sm:text-[10px] xl:text-[7.5px] font-mono text-stone-400 capitalize whitespace-nowrap">
                    {block.color} ({Math.max(...block.shape.map(p => p.z)) - Math.min(...block.shape.map(p => p.z)) + 1} Stack)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
