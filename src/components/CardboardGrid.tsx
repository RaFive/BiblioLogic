/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Color, Position, BookBlock, GameState } from '../types';
import { Trash2, RefreshCw, Undo2, RotateCw, Eye } from 'lucide-react';

interface CardboardGridProps {
  gameState: GameState;
  placeBlock: (x: number, y: number) => boolean;
  removeBlockFromGrid: (blockId: string) => void;
  resetLevel: () => void;
  undo: () => void;
  canUndo: boolean;
  currentMaxZ: number;
  rotateBlock: (id: string) => void;
  hideControlsOnDesktop?: boolean;
  isTopView?: boolean;
  toggleTopView: () => void;
}

// Visual color configs for the 3D book faces with paper edge texturing
const COLOR_MAP: Record<Color, { topBg: string; leftBg: string; frontBg: string; shadow: string }> = {
  red: {
    topBg: 'bg-rose-500 border-rose-400',
    leftBg: 'bg-rose-600',
    frontBg: 'bg-rose-700',
    shadow: 'shadow-rose-900/40'
  },
  blue: {
    topBg: 'bg-indigo-500 border-indigo-400',
    leftBg: 'bg-indigo-600',
    frontBg: 'bg-indigo-700',
    shadow: 'shadow-indigo-900/40'
  },
  green: {
    topBg: 'bg-emerald-500 border-emerald-400',
    leftBg: 'bg-emerald-600',
    frontBg: 'bg-emerald-700',
    shadow: 'shadow-emerald-950/40'
  },
  yellow: {
    topBg: 'bg-amber-400 border-amber-300',
    leftBg: 'bg-amber-500',
    frontBg: 'bg-amber-600',
    shadow: 'shadow-amber-900/40'
  }
};

export default function CardboardGrid({
  gameState,
  placeBlock,
  removeBlockFromGrid,
  resetLevel,
  undo,
  canUndo,
  currentMaxZ,
  rotateBlock,
  hideControlsOnDesktop = false,
  isTopView = false,
  toggleTopView
}: CardboardGridProps) {
  // Track currently hovered coordinate for the ghost landing preview
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Derive gravity landing coordinates if a block is selected and a cell is hovered
  let ghostCells: { x: number; y: number; z: number; color: Color }[] = [];
  const selectedBlock = gameState.inventory.find(b => b.id === gameState.selectedBlockId);

  if (selectedBlock && hoveredCell) {
    const ax = selectedBlock.shape[0]?.x ?? 0;
    const ay = selectedBlock.shape[0]?.y ?? 0;
    const { x, y } = hoveredCell;

    // 1. Validasi batas grid horizontal
    let inBounds = true;
    for (const pos of selectedBlock.shape) {
      const gx = x + (pos.x - ax);
      const gy = y + (pos.y - ay);
      if (gx < 0 || gx >= 3 || gy < 0 || gy >= 3) {
        inBounds = false;
        break;
      }
    }

    if (inBounds) {
      // 2. Petakan segmen berdasarkan kolom (gx, gy)
      const columnsMap: Record<string, { gx: number; gy: number; segments: Position[] }> = {};
      selectedBlock.shape.forEach(pos => {
        const gx = x + (pos.x - ax);
        const gy = y + (pos.y - ay);
        const key = `${gx}_${gy}`;
        if (!columnsMap[key]) {
          columnsMap[key] = { gx, gy, segments: [] };
        }
        columnsMap[key].segments.push(pos);
      });

      let overallValid = true;
      const ghostPlacement: { x: number; y: number; z: number; color: Color }[] = [];

      // 3. Untuk setiap kolom, cari Z mendarat terendah yang bebas
      for (const key of Object.keys(columnsMap)) {
        const { gx, gy, segments } = columnsMap[key];
        segments.sort((a, b) => a.z - b.z);

        let zFree = -1;
        for (let z = 0; z < currentMaxZ; z++) {
          if (gameState.grid[gx][gy][z] === null) {
            zFree = z;
            break;
          }
        }

        if (zFree === -1) {
          overallValid = false;
          break;
        }

        for (let i = 0; i < segments.length; i++) {
          const gz = zFree + i;
          if (gz >= currentMaxZ) {
            overallValid = false;
            break;
          }
          ghostPlacement.push({
            x: gx,
            y: gy,
            z: gz,
            color: selectedBlock.color
          });
        }
        if (!overallValid) break;
      }

      if (overallValid) {
        ghostCells = ghostPlacement;
      }
    }
  }

  // Handle slot clicking
  const handleCellClick = (x: number, y: number) => {
    if (gameState.selectedBlockId) {
      const placed = placeBlock(x, y);
      if (placed) {
        setHoveredCell(null); // Clear preview
      }
    }
  };

  // Render a 3D book block
  const renderBook = (block: BookBlock, x: number, y: number, z: number, isGhost = false) => {
    const colors = COLOR_MAP[block.color];
    const zIndex = x + y + (z * 10) + (isGhost ? 50 : 0);
    
    // Constant dimension metrics
    const sizeOffset = "w-[4.4rem] h-[4.4rem]"; // Size of flat base
    const height = 30; // Height of 3D spine/pages in px

    return (
      <div
        key={`${isGhost ? 'g' : 'b'}_${block.id}_${x}_${y}_${z}`}
        id={`${isGhost ? 'ghost' : 'book'}_${block.id}`}
        onMouseEnter={() => {
          if (!isGhost) {
            setHoveredCell({ x, y });
          }
        }}
        onMouseLeave={() => {
          if (!isGhost) {
            setHoveredCell(null);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isGhost) {
            handleCellClick(x, y);
          }
        }}
        className={`absolute origin-center transition-all duration-300 transform-3d select-none
          ${isGhost ? 'opacity-50 pointer-events-none scale-95' : (gameState.selectedBlockId ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default')}
        `}
        style={{
          left: `${x * 4.6}rem`,
          top: `${y * 4.6}rem`,
          transform: `translateZ(${z * 34}px)`,
          zIndex: zIndex,
          transformStyle: 'preserve-3d',
        }}
        title={isGhost ? "Ghost Preview" : `Buku ${block.color} (Z = ${z + 1})`}
      >
        {/* Book Container wrapper */}
        <div className={`relative ${sizeOffset} transform-3d`} style={{ transformStyle: 'preserve-3d' }}>
          
          {/* Top cover page */}
          <div
            className={`absolute inset-0 rounded-[4px] border-b-2 flex flex-col justify-center items-center text-[10px] text-white/50 font-sans tracking-widest font-bold shadow-md ${colors.topBg}`}
            style={{
              transform: `translateZ(${height}px)`,
              boxShadow: `0 8px 12px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)`
            }}
          >
            {/* Elegant book detail: spine line/emboss on cover */}
            <div className="w-[85%] h-[85%] border border-white/20 rounded-[2px] flex items-center justify-center relative">
              <span className="opacity-75 tracking-tighter uppercase font-mono text-[9px] text-white/80">
                {block.color.substring(0, 3)}
              </span>
              <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-white/25"></div>
            </div>
          </div>

          {/* Bottom cover page (prevents any hollow or see-through look) */}
          <div
            className={`absolute inset-0 rounded-[4px] ${colors.frontBg}`}
            style={{
              transform: 'translateZ(0px)',
            }}
          />

          {/* Front-Left Face (front visible side) - White Stack of Papers */}
          <div
            className="absolute bottom-0 left-[1px] right-[1px] bg-[#FAF8F5] border-x border-stone-250"
            style={{
              height: `${height}px`,
              transform: `rotateX(-90deg)`,
              transformOrigin: 'bottom',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.05)'
            }}
          >
            {/* Pages texture on front face to represent papers stack */}
            <div className="w-full h-full flex flex-col justify-around py-[1.5px] px-[4px] opacity-80">
              <div className="h-[1px] bg-stone-350/70"></div>
              <div className="h-[1.5px] bg-stone-200/50"></div>
              <div className="h-[1px] bg-stone-350/70"></div>
              <div className="h-[1.5px] bg-stone-200/50"></div>
              <div className="h-[1px] bg-stone-350/70"></div>
            </div>
          </div>

          {/* Back-Right Face (rear-right visible side) - White Stack of Papers */}
          <div
            className="absolute top-0 left-[1px] right-[1px] bg-[#FAF8F5] border-x border-stone-250"
            style={{
              height: `${height}px`,
              transform: `rotateX(90deg)`,
              transformOrigin: 'top',
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.05)'
            }}
          >
            {/* Pages texture on back face to represent papers stack */}
            <div className="w-full h-full flex flex-col justify-around py-[1.5px] px-[4px] opacity-80">
              <div className="h-[1px] bg-stone-350/70"></div>
              <div className="h-[1.5px] bg-stone-200/50"></div>
              <div className="h-[1px] bg-stone-350/70"></div>
            </div>
          </div>

          {/* Back-Left Face (rear-left side) - White Stack of Papers */}
          <div
            className="absolute top-0 bottom-0 bg-[#F5F2EA] border-y border-stone-250"
            style={{
              width: `${height}px`,
              left: 0,
              transform: `rotateY(-90deg)`,
              transformOrigin: 'left',
              boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.05)'
            }}
          >
            {/* Pages texture on left face to represent papers stack */}
            <div className="w-full h-full flex flex-col justify-around py-[3px] px-[1.5px] opacity-85">
              <div className="w-[1px] h-full bg-stone-350/70"></div>
              <div className="w-[1.5px] h-full bg-stone-200/50"></div>
              <div className="w-[1px] h-full bg-stone-350/70"></div>
            </div>
          </div>

          {/* Side Face (spine) (front-right visible side) - Spine binder of the book */}
          <div
            className={`absolute top-[0.5px] bottom-[0.5px] rounded-r-[2px] ${colors.leftBg}`}
            style={{
              width: `${height}px`,
              right: 0,
              transform: `rotateY(90deg) translateZ(0.1px)`,
              transformOrigin: 'right',
              boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.2)'
            }}
          >
            {/* Book Spine label */}
            <div className="w-full h-full flex flex-col justify-between items-center py-1 select-none">
              <div className="w-[70%] h-[4px] bg-yellow-300/60 rounded"></div>
              <div className="w-[1.5px] h-[55%] bg-black/10"></div>
              <div className="w-[70%] h-[2px] bg-black/10"></div>
            </div>
          </div>

          {/* Book Bottom base shadow layer */}
          <div
            className={`absolute inset-0 bg-neutral-900/35 blur-[3px] rounded-[6px] -z-10`}
            style={{
              transform: 'translateZ(-1px) scale(0.95)',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div id="cardboard-section" className="flex flex-col items-center select-none w-full">
      {/* Box Control Actions */}
      <div className={`w-full max-w-[400px] xl:max-w-[420px] flex justify-between items-center px-1.5 sm:px-4 mb-2 sm:mb-4 relative z-20 gap-1.5 ${hideControlsOnDesktop ? 'xl:hidden' : ''}`}>
        <div className="flex gap-1.5">
          {gameState.selectedBlockId ? (
            <button
              id="btn-rotate-active"
              onClick={() => rotateBlock(gameState.selectedBlockId!)}
              disabled={gameState.rotationsLeft <= 0}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded shadow-sm text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all select-none border-b-2 animate-pulse whitespace-nowrap flex-shrink-0
                ${gameState.rotationsLeft > 0 
                  ? 'bg-amber-100/90 border-amber-300 text-amber-800 hover:bg-amber-200/80 hover:border-amber-400 active:translate-y-0.5 cursor-pointer' 
                  : 'bg-stone-200/40 text-stone-400 border-none cursor-not-allowed opacity-60'}
              `}
              title={`Putar Buku Pilihan. Sisa rotasi: ${gameState.rotationsLeft}x`}
            >
              <RotateCw size={11} className={gameState.rotationsLeft > 0 ? "text-amber-600 animate-spin-slow" : "text-stone-400"} />
              Putar ({gameState.rotationsLeft}x)
            </button>
          ) : (
            <button
              id="btn-rotate-disabled"
              disabled
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded border border-stone-300 bg-stone-200/50 text-stone-500 shadow-sm text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 select-none cursor-not-allowed opacity-60 whitespace-nowrap flex-shrink-0"
              title="Pilih buku dalam tas atau kardus terlebih dahulu untuk memutar"
            >
              <RotateCw size={11} className="text-stone-400" />
              Putar ({gameState.rotationsLeft}x)
            </button>
          )}

          <button
            id="btn-toggle-view"
            onClick={toggleTopView}
            className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded shadow-sm text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all select-none border-b-2 whitespace-nowrap flex-shrink-0
              ${isTopView ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-[#FDFBF7] border-stone-300'}
            `}
            title="Ubah Tampilan"
          >
            <Eye size={11} className={isTopView ? 'text-indigo-600' : 'text-stone-500'} />
            {isTopView ? 'Samping' : 'Atas'}
          </button>
        </div>
        
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            id="btn-undo-move"
            onClick={undo}
            disabled={!canUndo}
            className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded shadow-sm text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all select-none whitespace-nowrap flex-shrink-0
              ${canUndo 
                ? 'bg-[#FDFBF7] border-b-2 border-stone-300 hover:border-stone-400 text-stone-700 hover:translate-y-0.5 active:translate-y-1 cursor-pointer' 
                : 'bg-stone-200/50 text-stone-400 border-none cursor-not-allowed opacity-60'}
            `}
            title="Batalkan Langkah Terakhir"
          >
            <Undo2 size={11} className={canUndo ? "text-stone-500" : "text-stone-400"} />
            Batal
          </button>
          <button
            id="btn-reset-board"
            onClick={resetLevel}
            className="bg-[#FDFBF7] px-2 py-1.5 sm:px-4 sm:py-1.5 rounded shadow-sm border-b-2 border-stone-300 text-[10px] sm:text-xs font-semibold text-stone-700 hover:translate-y-0.5 active:translate-y-1 transition-transform cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap flex-shrink-0"
            title="Ulangi Level Ini"
          >
            <RefreshCw size={11} className="text-stone-500" />
            Ulang
          </button>
        </div>
      </div>

      {/* Main 3D Container viewport */}
      <div 
        id="isometric-viewport"
        className="relative w-[260px] h-[260px] md:w-[290px] md:h-[290px] xl:w-[340px] xl:h-[340px] flex items-center justify-center bg-transparent mt-6 md:mt-12 xl:mt-4 mb-2 md:mb-3 xl:mb-2 z-10"
        style={{ perspective: '900px' }}
      >
        {/* Cardboard Box Container with rotated 3D properties */}
        <div
          id="cardboard-3d-box"
          className="relative transition-transform duration-500 ease-out flex items-center justify-center"
          style={{
            transform: isTopView ? 'rotateX(0deg) rotateZ(0deg)' : 'rotateX(58deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d',
            width: '15.5rem',
            height: '15.5rem'
          }}
        >
          {/* Cardboard Kraft Paper Base Floor */}
          <div
            className="absolute inset-[4px] bg-[#D6C2B0] rounded-sm shadow-[inset_0_12px_24px_rgba(0,0,0,0.18)] border-2 border-stone-400 flex items-center justify-center"
            style={{
              transform: 'translateZ(-2px)',
            }}
          >
            {/* Ground grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border-collapse opacity-40">
              {Array(9).fill(null).map((_, idx) => (
                <div key={`gline_${idx}`} className="border border-[#7F6B56]/15"></div>
              ))}
            </div>
          </div>

          {/* 3D Visual Walls of Cardboard Box (Kraft paper material) */}
          {/* 1. FRONT-LEFT Wall (along Y-axis at X = 0) */}
          {isTopView ? (
            <div
              className="absolute left-[2px] top-[4px] bottom-[4px] w-[110px] bg-[#C1AF9B] origin-left border-l border-y border-[#A59480]"
              style={{
                transform: 'rotateY(-90deg)',
                boxShadow: 'inset 15px 0 30px rgba(0,0,0,0.22)',
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className="absolute top-0 bottom-0 right-[-45px] w-[45px] bg-[#C1AF9B] border-r border-y border-[#A59480]/60 origin-left"
                style={{
                  transform: 'rotateY(-35deg)',
                  clipPath: 'polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%)',
                  boxShadow: '4px 0 8px rgba(0,0,0,0.05)',
                  transformStyle: 'preserve-3d'
                }}
              />
            </div>
          ) : (
            <div
              className="absolute left-[2px] top-[4px] bottom-[4px] w-[26px] bg-[#C1AF9B] origin-left border-l border-y border-[#ECE0CE]"
              style={{
                transform: 'rotateY(-90deg)',
                boxShadow: 'inset -5px 0 15px rgba(255,255,255,0.4), 0 5px 10px rgba(0,0,0,0.1)'
              }}
            />
          )}

          {/* 2. BACK-LEFT Wall (along X-axis at Y = 0) */}
          <div
            className="absolute top-[2px] left-[4px] right-[4px] h-[110px] bg-[#C1AF9B] origin-top border-t border-x border-[#A59480]"
            style={{
              transform: 'rotateX(90deg)',
              boxShadow: 'inset 0 15px 30px rgba(0,0,0,0.22)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Open cardboard box flap (folding outward, further up/away) */}
            <div
              className="absolute left-0 right-0 bottom-[-45px] h-[45px] bg-[#C1AF9B] border-b border-x border-[#A59480]/60 origin-top"
              style={{
                transform: 'rotateX(35deg)',
                clipPath: 'polygon(8% 100%, 92% 100%, 100% 0%, 0% 0%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                transformStyle: 'preserve-3d'
              }}
            />
          </div>

          {/* 3. FRONT-RIGHT Wall (at bottom of visual workspace, Y = max) */}
          {isTopView ? (
            <div
              className="absolute bottom-[2px] left-[4px] right-[4px] h-[110px] bg-[#C1AF9B] origin-bottom border-b border-x border-[#A59480]"
              style={{
                transform: 'rotateX(-90deg)',
                boxShadow: 'inset 0 -15px 30px rgba(0,0,0,0.22)',
                transformStyle: 'preserve-3d'
              }}
            >
               <div
                className="absolute left-0 right-0 top-[-45px] h-[45px] bg-[#C1AF9B] border-t border-x border-[#A59480]/60 origin-bottom"
                style={{
                  transform: 'rotateX(-35deg)',
                  clipPath: 'polygon(0% 100%, 100% 100%, 92% 0%, 8% 0%)',
                  boxShadow: '0 -4px 8px rgba(0,0,0,0.05)',
                  transformStyle: 'preserve-3d'
                }}
              />
            </div>
          ) : (
            <div
              className="absolute bottom-[2px] left-[4px] right-[4px] h-[26px] bg-[#C1AF9B] origin-bottom border-b border-x border-[#ECE0CE]"
              style={{
                transform: 'rotateX(-90deg)',
                boxShadow: 'inset 0 -5px 15px rgba(255,255,255,0.4), 0 5px 10px rgba(0,0,0,0.1)'
              }}
            />
          )}

          {/* 4. BACK-RIGHT Wall (at right-most visual workspace, X = max) */}
          <div
            className="absolute right-[2px] top-[4px] bottom-[4px] w-[110px] bg-[#C1AF9B] origin-right border-r border-y border-[#A59480]"
            style={{
              transform: 'rotateY(90deg)',
              boxShadow: 'inset 15px 0 30px rgba(0,0,0,0.22)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Open cardboard box flap (folding outward, further right-down/away) */}
            <div
              className="absolute top-0 bottom-0 left-[-45px] w-[45px] bg-[#C1AF9B] border-l border-y border-[#A59480]/60 origin-right"
              style={{
                transform: 'rotateY(35deg)',
                clipPath: 'polygon(0% 8%, 100% 0%, 100% 100%, 0% 92%)',
                boxShadow: '-4px 0 8px rgba(0,0,0,0.05)',
                transformStyle: 'preserve-3d'
              }}
            />
          </div>

          {/* Active grid slots mapping */}
          <div
            className="absolute inset-[14px] bg-transparent transform-3d"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Render Slot Base Columns */}
            {Array(3).fill(null).map((_, x) =>
              Array(3).fill(null).map((_, y) => {
                const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                return (
                  <div
                    key={`slot_${x}_${y}`}
                    id={`slot_${x}_${y}`}
                    onMouseEnter={() => setHoveredCell({ x, y })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(x, y)}
                    className={`absolute rounded-sm w-[4.4rem] h-[4.4rem] cursor-pointer transition-all duration-200 flex items-center justify-center
                      ${isHovered && gameState.selectedBlockId ? 'bg-stone-300/35' : 'bg-black/[0.04] hover:bg-black/[0.08]'}
                    `}
                    style={{
                      left: `${x * 4.6}rem`,
                      top: `${y * 4.6}rem`,
                      transform: 'translateZ(0px)',
                      border: isHovered && gameState.selectedBlockId ? '2px dashed #78716c' : '1px solid rgba(121,113,107,0.15)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                  </div>
                );
              })
            )}

            {/* Render actual placed BookBlocks on the Grid */}
            {(() => {
              const elements: any[] = [];
              const renderedBlockIds = new Set<string>();

              // Iterate through 3D cells and render books
              for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                  for (let y = 0; y < 3; y++) {
                    const block = gameState.grid[x][y][z];
                    if (block && !renderedBlockIds.has(`${block.id}_${x}_${y}_${z}`)) {
                      // Anchor layout render
                      elements.push(renderBook(block, x, y, z));
                    }
                  }
                }
              }
              return elements;
            })()}

            {/* Render Ghost Preview of selected block hovering under gravity */}
            {ghostCells.map(cell => {
              const dummyBlock: BookBlock = {
                id: `ghost_b_${cell.x}_${cell.y}_${cell.z}`,
                color: cell.color,
                shape: [],
                isRotated: 0
              };
              return renderBook(dummyBlock, cell.x, cell.y, cell.z, true);
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
