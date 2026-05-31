/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Color } from '../types';
import { BookOpen } from 'lucide-react';

interface GoalPanelProps {
  targetGoal: (Color | null)[][][];
}

// Background maps to style the targets appropriately in 2D
const BG_CLASSES: Record<Color, string> = {
  red: 'bg-rose-500 border-rose-600 shadow-sm shadow-rose-950/20',
  blue: 'bg-indigo-500 border-indigo-600 shadow-sm shadow-indigo-950/20',
  green: 'bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-950/20',
  yellow: 'bg-amber-400 border-amber-500 shadow-sm shadow-amber-950/20'
};

export default function GoalPanel({ targetGoal }: GoalPanelProps) {

  // Helper to render a single 2D matrix representing a vertical layer (Z)
  const renderLayer2D = (zLevel: number, label: string) => {
    const cells = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const color = targetGoal[x][y][zLevel];
        cells.push(
          <div
            key={`goal_cell_${x}_${y}_${zLevel}`}
            className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-[2px] sm:rounded flex items-center justify-center text-[7px] sm:text-[8px] font-mono select-none border transition-all duration-300
              ${color 
                ? `${BG_CLASSES[color]} text-white border-black/10 font-bold` 
                : 'bg-stone-100/30 border-dashed border-stone-200 text-stone-300/40'}
            `}
            title={color ? `Target: Buku ${color} di titik (${x}, ${y}, Z=${zLevel + 1})` : `Titik (${x}, ${y}, Z=${zLevel + 1}) harus kosong`}
          >
            {color && color[0].toUpperCase()}
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col items-center">
        <span className="text-[7.5px] sm:text-[8.5px] font-mono text-stone-500 font-bold uppercase mb-0.5 sm:mb-1 bg-stone-150 border border-stone-250 px-1 sm:px-1.5 py-0.5 rounded shadow-inner">
          {label}
        </span>
        <div className="grid grid-cols-3 gap-0.5 bg-[#FAF8F5] p-0.5 sm:p-1 rounded border border-stone-300 shadow-sm">
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div id="goal-panel-container" className="relative w-full max-w-[420px] select-none mx-auto">
      {/* Space saving target card */}
      <div
        id="goal-panel-card"
        className="relative bg-[#FDFBF7]/90 border border-stone-300 rounded-lg shadow-sm p-1.5 sm:p-3 flex flex-col gap-1 sm:gap-2 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-1 sm:pb-1.5">
          <h3 className="font-sans font-bold text-[9px] sm:text-[10px] tracking-wider text-stone-600 uppercase flex items-center gap-1 sm:gap-1.5 select-none">
            <BookOpen size={11} className="text-stone-500 animate-pulse" />
            CETAK BIRU PENYUSUNAN
          </h3>
          
          <div className="flex items-center gap-1.5 text-[7px] sm:text-[8px] text-stone-500 font-mono select-none">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 border border-rose-600" /> R</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 border border-indigo-600" /> B</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 border border-emerald-600" /> G</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-amber-500" /> Y</span>
          </div>
        </div>

        <div className="flex flex-row justify-around items-center gap-1 sm:gap-2">
          {renderLayer2D(0, 'DASAR')}
          {renderLayer2D(1, 'TENGAH')}
          {renderLayer2D(2, 'ATAS')}
        </div>
      </div>
    </div>
  );
}
