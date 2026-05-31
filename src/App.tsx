/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useGameEngine } from './useGameEngine';
import CardboardGrid from './components/CardboardGrid';
import Inventory from './components/Inventory';
import GoalPanel from './components/GoalPanel';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Trophy,
  Dices,
  CheckCircle2,
  ChevronRight,
  Library,
  Flame,
  Award,
  BookMarked,
  RotateCw,
  Undo2,
  RefreshCw,
  Eye,
  Smartphone,
  RotateCcw
} from 'lucide-react';

export default function App() {
  const {
    gameState,
    isCampaign,
    setIsCampaign,
    currentLevelIndex,
    setCurrentLevelIndex,
    difficulty,
    setDifficulty,
    isWon,
    selectBlock,
    rotateBlock,
    placeBlock,
    removeBlockFromGrid,
    resetLevel,
    campaignLevels,
    loadCampaignLevel,
    generateRandomLevelPlay,
    history,
    undo,
    currentMaxZ
  } = useGameEngine();

  // Modal display controllers
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [isTopView, setIsTopView] = useState<boolean>(false);

  // Mobile viewport view-tracker: 'selection' (menyusun buku / pilih level) or 'puzzle' (workspace main)
  const [mobileScreen, setMobileScreen] = useState<'selection' | 'puzzle'>('selection');

  // Completed campaign tracker to display green completions badges (optional client-side state)
  const [campaignProgress, setCampaignProgress] = useState<Record<number, boolean>>(() => {
    return { 0: true }; // First level unlocked by default
  });

  const activeLevel = campaignLevels[currentLevelIndex];

  // Advance level helper
  const handleNextLevel = () => {
    if (isCampaign) {
      const nextIndex = currentLevelIndex + 1;
      if (nextIndex < campaignLevels.length) {
        // Record completion on current index
        setCampaignProgress(prev => ({
          ...prev,
          [currentLevelIndex]: true,
          [nextIndex]: true // Unlock next
        }));
        setCurrentLevelIndex(nextIndex);
      } else {
        // All levels completed fallback
        setIsCampaign(false); // Switch to infinite randomized play
      }
    } else {
      generateRandomLevelPlay(difficulty);
    }
  };

  // Helper to render a physical wooden bookshelf shelf row (tingkat) with hollow/bolong support backing
  const renderShelfTier = (tierIndex: number, label: string) => {
    const startIndex = tierIndex * 10;
    const endIndex = startIndex + 10;
    const tierLevels = campaignLevels.slice(startIndex, endIndex);

    return (
      <div key={`shelf-tier-${tierIndex}`} className="flex flex-col gap-1 relative w-full">
        {/* Tier label indicating levels resembling shelf headings */}
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-mono font-bold tracking-wider text-amber-800 uppercase flex items-center gap-1 bg-amber-100/40 px-1 py-0.5 rounded shadow-sm border border-amber-800/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8d6e63]" />
            {label}
          </span>
        </div>

        {/* The hollow cabinet backing effect (bolong) */}
        <div 
          className="relative flex items-end justify-between px-2 pt-2.5 pb-1.5 min-h-[70px] bg-stone-300/10 border-x border-t border-dashed border-[#8d6e63]/30 rounded-t-md shadow-inner"
        >
          {/* Transparent back effect letting the container background remain visible, making it feel open/bolong */}
          <div className="absolute inset-0 bg-black/[0.02] rounded-t-md pointer-events-none" />

          {/* 10 columns grid for responsive scaling books on a single row */}
          <div className="w-full grid grid-cols-10 gap-[3px] md:gap-1.5 z-10 items-end justify-items-center">
            {tierLevels.map((lvl, localIdx) => {
              const globalIdx = startIndex + localIdx;
              const isActive = globalIdx === currentLevelIndex;
              const isUnlocked = globalIdx <= Object.keys(campaignProgress).length;

              // Color choices matching clean physical books spines
              const bookColors = [
                'bg-rose-500 hover:bg-rose-400 border-rose-600 shadow-sm shadow-rose-950/25',
                'bg-[#4B6584] hover:bg-[#5C7D99] border-[#384C62] shadow-sm shadow-blue-950/25',
                'bg-[#20BF6B] hover:bg-[#26DE81] border-[#168E4F] shadow-sm shadow-emerald-950/25',
                'bg-amber-500 hover:bg-amber-400 border-amber-600 shadow-sm shadow-amber-950/25',
                'bg-indigo-600 hover:bg-indigo-500 border-indigo-800 shadow-sm shadow-indigo-950/25'
              ];
              const chosenColor = bookColors[globalIdx % bookColors.length];

              return (
                <button
                  key={lvl.id}
                  id={`btn-campaign-lvl-${lvl.id}`}
                  onClick={() => {
                    if (isUnlocked) {
                      setCurrentLevelIndex(globalIdx);
                      setMobileScreen('puzzle');
                    }
                  }}
                  disabled={!isUnlocked}
                  className={`relative select-none text-[10px] font-mono p-0.5 flex flex-col justify-between items-center transition-all duration-300 rounded-[3px] border-b-2 hover:-translate-y-1 mx-auto w-[24px] h-[58px] flex-none
                    ${isActive 
                      ? 'scale-115 -translate-y-1.5 z-20 border-t border-r border-[#ffffff]/40 ring-1 ring-[#8d6e63]/50 shadow-md' 
                      : 'opacity-85'}
                    ${isUnlocked 
                      ? `${chosenColor} text-white cursor-pointer` 
                      : 'bg-stone-300/40 border-stone-400/20 text-stone-400/40 cursor-not-allowed opacity-30'}
                  `}
                  title={`Level ${lvl.id}: ${lvl.name}`}
                >
                  {/* Spine gold bookmark label block */}
                  <div className="w-[1.5px] h-[15%] bg-white/30 mt-0.5" />
                  
                  {/* short numeric printout */}
                  <span 
                    className="font-bold tracking-tighter text-[7.5px] md:text-[8px] select-none text-center font-mono py-0.5"
                    style={{ writingMode: 'vertical-rl', textTransform: 'uppercase' }}
                  >
                    {isUnlocked ? `${String(lvl.id).padStart(2, '0')}` : '🔒'}
                  </span>

                  {/* Bookmark tail accent */}
                  <div className="w-[80%] h-[2.5px] bg-yellow-300/60 rounded-[1px] mb-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Supporting physical wooden shelf plank at the base of the tier */}
        <div className="h-2 bg-[#8d6e63] border-t border-b border-[#5d4037] w-full shadow-md rounded-b-md" />
      </div>
    );
  };

  return (
    <div id="game-root" className="min-h-screen xl:h-[100dvh] w-screen bg-[#E8E4DE] text-stone-800 font-sans antialiased relative overflow-y-auto xl:overflow-hidden flex flex-col">
      
      {/* Landscape lock overlay */}
      <div className="fixed inset-0 z-[9999] bg-[#E8E4DE] text-stone-800 flex-col items-center justify-center p-6 text-center landscape:max-lg:flex hidden">
        <div className="relative mb-6">
          <Smartphone className="w-16 h-16 text-stone-400 rotate-90" />
          <RotateCcw className="w-8 h-8 text-stone-600 absolute -bottom-2 -right-2 animate-spin duration-3000" />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight mb-2">Putar Perangkat Anda</h2>
        <p className="text-sm text-stone-500 max-w-sm">
          Game ini dirancang khusus untuk digunakan dalam mode portrait untuk pengalaman bermain yang lebih optimal.
        </p>
      </div>

      {/* Visual background page layout enhancements for clean minimalist feel */}
      <div className="absolute top-0 inset-x-0 h-1 bg-stone-400/80 z-50"></div>
      <div className="absolute left-4 top-16 w-32 h-32 bg-stone-300/10 rounded-full filter blur-xl select-none pointer-events-none" />
      <div className="absolute right-4 bottom-24 w-40 h-40 bg-stone-300/10 rounded-full filter blur-xl select-none pointer-events-none" />

      {/* Main Page Top Header wrapper */}
      <header className={`max-w-7xl mx-auto px-4 pt-4 pb-1 w-full flex-none select-none ${mobileScreen === 'puzzle' ? 'hidden xl:block' : 'block'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-stone-300 pb-3">
          <div className="text-center md:text-left animate-fade-in">
            <h1 className="font-sans text-3xl md:text-4xl text-stone-700 font-bold tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Library className="text-stone-600 animate-pulse" size={28} />
              BiblioLogic
              <span className="hidden lg:flex text-[10px] font-mono font-normal uppercase tracking-widest bg-stone-300/30 border border-stone-400/50 px-2.5 py-0.5 rounded text-stone-600 ml-2">
                {isCampaign ? `Level ${String(currentLevelIndex + 1).padStart(2, '0')}` : 'ENDLESS'} — The Archivist's Puzzle
              </span>
            </h1>
            <p className="text-xs text-stone-500 font-sans tracking-wide mt-1 animate-fade-in delay-100">
              Teka-teki spasial 3D: Lipat gandakan fokusmu untuk menyusun karya sastra murni ke dimensi presisi kardus.
            </p>
          </div>

          {/* Quick Core Navigation Tab Button */}
          <div className="flex items-center gap-2 mt-3 md:mt-0">
            <button
              id="btn-how-to-play"
              onClick={() => setShowHowTo(!showHowTo)}
              className="bg-[#FDFBF7] px-4 py-1.5 rounded shadow-sm border-b-2 border-stone-300 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
              title="Cara Bermain"
            >
              <HelpCircle size={14} className="text-stone-500" />
              Cara Bermain
            </button>
            <div className="h-6 w-[1px] bg-stone-300 mx-1"></div>
                  {/* Mode switch controllers */}
            <div className="bg-[#FAF8F5]/35 p-1 rounded border border-stone-300/60 flex gap-1">
              <button
                id="btn-tab-campaign"
                onClick={() => {
                  setIsCampaign(true);
                  setMobileScreen('selection');
                }}
                className={`text-xs px-3.5 py-1.5 rounded transition cursor-pointer font-medium select-none
                  ${isCampaign 
                    ? 'bg-[#FDFBF7] text-stone-800 shadow-sm border-b border-stone-300' 
                    : 'text-stone-550 hover:bg-stone-350/20'}
                `}
              >
                Campaign
              </button>
              <button
                id="btn-tab-endless"
                onClick={() => {
                  setIsCampaign(false);
                  generateRandomLevelPlay(difficulty);
                  setMobileScreen('selection');
                }}
                className={`text-xs px-3.5 py-1.5 rounded transition cursor-pointer font-medium select-none
                  ${!isCampaign 
                    ? 'bg-[#FDFBF7] text-stone-800 shadow-sm border-b border-stone-300' 
                    : 'text-stone-550 hover:bg-stone-350/20'}
                `}
              >
                Endless
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board Workspace split grid */}
      <main className={`max-w-7xl mx-auto px-1.5 sm:px-4 w-full flex-1 min-h-0 xl:overflow-y-auto ${mobileScreen === 'puzzle' ? 'mt-1 sm:mt-3' : 'mt-2 sm:mt-4'}`}>
        
        {/* Expanded Foldout Guide Instructions Panel */}
        <AnimatePresence>
          {showHowTo && (
            <motion.div
              id="how-to-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <div className="relative bg-[#FFFCF5] border border-[#E9E4DC] shadow-sm rounded-sm mb-2 w-full overflow-hidden">
                {/* Spiral notebook holes */}
                <div className="absolute top-2.5 left-0 right-0 w-full flex justify-around px-2 opacity-60 z-0 overflow-hidden">
                  {[...Array(60)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#E8E3DA] shadow-inner shrink-0 mx-1" />
                  ))}
                </div>
                
                {/* Top margin line */}
                <div className="absolute top-14 left-0 right-0 h-[2px] bg-red-400/25 z-0"></div>

                <div className="pt-6 pb-6 px-6 sm:px-8 relative z-10 w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-serif italic font-bold text-base text-stone-700 tracking-wide">
                      Catatan Penyusunan Buku
                    </h4>
                    <button
                      onClick={() => setShowHowTo(false)}
                      className="text-stone-400 hover:text-stone-600 transition-colors text-2xl leading-none -mt-1"
                    >
                      &times;
                    </button>
                  </div>
                  
                  <div 
                    className="flex flex-col xl:flex-row gap-x-8 gap-y-0 text-[13.5px] text-stone-700 font-medium"
                    style={{ 
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(168, 162, 158, 0.25) 27px, rgba(168, 162, 158, 0.25) 28px)', 
                      lineHeight: '28px',
                      backgroundAttachment: 'local'
                    }}
                  >
                    <div className="flex-1 shrink-0 px-2 lg:px-4">
                      <div className="flex gap-2"><span>1.</span><p>Perhatikan <b>Cetak Biru Penyusunan</b> untuk melihat target susunan warna buku.</p></div>
                      <div className="flex gap-2"><span>2.</span><p>Pilih dari panel <b>Buku Tak Tersusun</b>. Keterangan <b>Stack</b> menunjukkan tinggi buku.</p></div>
                    </div>
                    <div className="flex-1 shrink-0 px-2 lg:px-4">
                      <div className="flex gap-2"><span>3.</span><p>Letakkan buku ke <b>Kardus</b>. Buku dipengaruhi gravitasi dan jatuh ke posisi terbawah.</p></div>
                      <div className="flex gap-2"><span>4.</span><p>Gunakan tombol panah pada kartu untuk rotasi. Tekan <b>Undo</b> jika salah posisi.</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:h-full xl:overflow-hidden">
          
          {/* =========================================================================
              LEFT COLUMN (LEDGER): Level Selector & Presets
              ========================================================================= */}
          <section 
            id="sidebar-ledger" 
            className={`lg:col-span-12 xl:col-span-4 space-y-4 flex-col xl:h-full xl:overflow-y-auto pb-6 pr-1
              ${mobileScreen === 'selection' ? 'flex' : 'hidden xl:flex'}
            `}
          >
            
            {/* Level selector/preset header */}
            <div className="bg-[#FDFBF7]/50 border border-stone-300 p-4 rounded shadow-sm w-full max-w-[390px] mx-auto">
              
              {isCampaign ? (
                // Campaign Selection Slide Map
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
                      <Flame size={13} className="text-stone-500 animate-pulse" />
                      ARSIP KARYA SASTRA
                    </h3>
                    <span className="text-[10px] bg-stone-300/40 text-stone-700 border border-stone-300 px-2 py-0.5 rounded tracking-tighter">
                      Terkumpul {Object.keys(campaignProgress).length - 1} / 30
                    </span>
                  </div>

                  {/* Vertical bookshelf cabinet containing exactly 3 hollow tiers */}
                  <div 
                    id="bookshelf-level-slider" 
                    className="border-4 border-[#5d4037] bg-[#5d4037]/5 p-2.5 rounded-lg flex flex-col gap-4 shadow-[#2d1c08]/10 shadow-sm relative select-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)' }}
                  >
                    {renderShelfTier(0, "RAK 1")}
                    {renderShelfTier(1, "RAK 2")}
                    {renderShelfTier(2, "RAK 3")}
                  </div>

                </div>
              ) : (
                // Endless Random Preset parameters
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-1.5">
                    <h3 className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
                      <Dices size={13} className="text-stone-500 animate-spin-slow" />
                      RANDOM GENERATE LEVEL (ENDLESS MODE)
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map(diff => {
                      const isSelected = difficulty === diff;
                      const roman = diff === 'easy' ? 'I' : diff === 'medium' ? 'II' : 'III';
                      const label = diff === 'easy' ? 'MUDAH' : diff === 'medium' ? 'SEDANG' : 'SULIT';
                      
                      let coverBgClass = '';
                      if (diff === 'easy') {
                        coverBgClass = isSelected 
                          ? 'bg-[#1b4332] text-[#d8f3dc] border-emerald-400/40 shadow-inner' 
                          : 'bg-[#2d6a4f] text-[#d8f3dc] border-[#1b4332]/45 hover:bg-[#22573e]';
                      } else if (diff === 'medium') {
                        coverBgClass = isSelected 
                          ? 'bg-[#78350f] text-[#fef3c7] border-amber-500/45 shadow-inner' 
                          : 'bg-[#b45309] text-[#fef3c7] border-[#78350f]/45 hover:bg-[#9a4305]';
                      } else {
                        coverBgClass = isSelected 
                          ? 'bg-[#791a1a] text-[#fee2e2] border-rose-500/45 shadow-inner' 
                          : 'bg-[#991b1b] text-[#fee2e2] border-[#7f1d1d]/45 hover:bg-[#851515]';
                      }

                      return (
                        <button
                          key={diff}
                          id={`btn-diff-${diff}`}
                          onClick={() => {
                            setDifficulty(diff);
                            generateRandomLevelPlay(diff);
                            setMobileScreen('puzzle');
                          }}
                          className="relative h-[115px] w-full cursor-pointer group select-none focus:outline-none focus:ring-0 active:scale-95 transition-all duration-200 bg-transparent"
                        >
                          {/* Underlying stacked paper block (viewed from top-right offset) */}
                          <div className="absolute right-[2px] bottom-[2px] top-2.5 left-2 bg-[#FAF5E6] border border-stone-300/80 rounded-r shadow-xs flex flex-col justify-between py-1 px-0.5 pointer-events-none opacity-90 z-0">
                            <div className="w-full h-[0.5px] bg-stone-300" />
                            <div className="w-full h-[0.5px] bg-stone-300" />
                            <div className="w-full h-[0.5px] bg-stone-300" />
                            <div className="w-full h-[0.5px] bg-stone-300" />
                          </div>

                          {/* Main Hardcover book cover lying on its back */}
                          <div className={`absolute top-0 left-0 bottom-2.5 right-2 rounded-l-[4px] rounded-r-[2.5px] border shadow-[1.5px_2px_4px_rgba(0,0,0,0.18)] flex flex-col justify-between p-1.5 transition-all duration-300 overflow-hidden z-10
                            ${coverBgClass}
                            ${isSelected ? 'ring-2 ring-amber-400/45 -translate-y-[2px] shadow-[2px_3px_6px_rgba(0,0,0,0.22)]' : 'opacity-95 hover:opacity-100 hover:-translate-y-0.5'}
                          `}>
                            {/* Stamped hardcover crease leather groove */}
                            <div className={`absolute left-2 top-0 bottom-0 w-[1px] ${isSelected ? 'bg-amber-400/25' : 'bg-black/15'}`} />

                            {/* Stamped binding/embossed accent headband */}
                            <div className="w-full flex flex-col gap-[0.5px] items-center">
                              <div className={`w-3/5 h-[1.5px] rounded-sm ${isSelected ? 'bg-amber-400/90' : 'bg-stone-300/30'}`} />
                              <div className="w-2/5 h-[0.5px] bg-white/10" />
                            </div>

                            {/* Embossed volume shield detail */}
                            <div className={`py-0.5 px-0.5 rounded border text-center w-full flex flex-col justify-center items-center my-auto transition-transform duration-300 group-hover:scale-102
                              ${isSelected 
                                ? 'bg-black/25 border-amber-400/50' 
                                : 'bg-black/10 border-white/20'
                              }
                            `}>
                              <span className="font-mono tracking-widest leading-none text-[6.5px] text-amber-300/85 uppercase block">
                                VOL
                              </span>
                              <span className="text-[10px] font-serif font-extrabold text-white mt-0.5 leading-none block">
                                {roman}
                              </span>
                            </div>

                            {/* Book cover volume/difficulty text indicator */}
                            <span className="text-[8.5px] tracking-wider font-sans font-extrabold uppercase truncate max-w-full text-center leading-none mt-0.5">
                              {label}
                            </span>
                          </div>

                          {/* Dynamic ribbon spine tag on select */}
                          {isSelected && (
                            <div className="absolute -bottom-1 right-4 w-2 h-3.5 bg-amber-500 border border-amber-600 rounded-b shadow-[0.5px_1px_2px_rgba(0,0,0,0.2)] animate-pulse z-20 pointer-events-none" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    id="btn-regenerate"
                    onClick={() => {
                      generateRandomLevelPlay(difficulty);
                      setMobileScreen('puzzle');
                    }}
                    className="w-full mt-4 h-14 bg-gradient-to-b from-[#2d1109] via-[#481f14] to-[#1e0a05] rounded-[4px] border border-[#160502] shadow-[0_4px_7px_rgba(0,0,0,0.3)] relative group flex items-center justify-between px-3 overflow-hidden active:scale-98 transition-all duration-300 hover:brightness-110 select-none focus:outline-none"
                  >
                    {/* Spine rounded lighting highlight / 3D sheen tube effect */}
                    <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-10" />

                    {/* Book spine left and right extreme edges representing the cloth headbands (kapital / threaded headbands) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 border-r border-[#160502]/40 z-20 flex flex-col justify-around py-[1px]">
                      <div className="h-[2px] bg-red-600 w-full" />
                      <div className="h-[2px] bg-stone-100 w-full" />
                      <div className="h-[2px] bg-red-600 w-full" />
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 border-l border-[#160502]/40 z-20 flex flex-col justify-around py-[1px]">
                      <div className="h-[2px] bg-red-600 w-full" />
                      <div className="h-[2px] bg-stone-100 w-full" />
                      <div className="h-[2px] bg-red-600 w-full" />
                    </div>

                    {/* Vertical Raised Ribs (Punggung Buku / Raised Bands) */}
                    {/* Rib 1 (Left) */}
                    <div className="absolute top-0 bottom-0 w-[4px] left-[18%] bg-gradient-to-r from-black/35 via-amber-500/60 to-black/35 border-x border-[#160502]/30 z-10 shadow-md" />
                    <div className="absolute top-0 bottom-0 w-[1px] left-[17.2%] bg-amber-400/25 z-10" />
                    <div className="absolute top-0 bottom-0 w-[1px] left-[19.2%] bg-amber-400/25 z-10" />

                    {/* Rib 2 (Right Area) */}
                    <div className="absolute top-0 bottom-0 w-[4px] right-[15%] bg-gradient-to-r from-black/35 via-amber-500/60 to-black/35 border-x border-[#160502]/30 z-10 shadow-md" />
                    <div className="absolute top-0 bottom-0 w-[1px] right-[14.2%] bg-amber-400/25 z-10" />
                    <div className="absolute top-0 bottom-0 w-[1px] right-[16.2%] bg-amber-400/25 z-10" />

                    {/* Left Spine Section (Removed Vintage Library Call Number Sticker Label) */}

                    {/* Center Spine Section - Gilded Foil Frame & Title Typography (Horizontal spine title) */}
                    <div className="flex-1 px-4 z-10 flex flex-col items-center justify-center relative border-y border-transparent">
                      {/* Double fine gilding border frames wrapping the text */}
                      <div className="absolute inset-y-1.5 left-2 right-2 border border-amber-500/35 rounded-sm opacity-80 pointer-events-none" />
                      <div className="absolute inset-y-2 left-2.5 right-2.5 border border-dashed border-amber-400/20 rounded-[1px] opacity-60 pointer-events-none" />

                      <div className="text-center flex flex-col justify-center select-none">
                        <span className="text-[6.5px] font-mono tracking-[0.18em] text-amber-200/80 uppercase block font-semibold leading-none -translate-y-[1px]">
                          • BIBLIO COMPILER COLLECTED •
                        </span>
                        <span className="font-serif font-extrabold text-[10px] md:text-[11px] text-[#FCF9F2] leading-none mt-1.5 tracking-wider flex items-center justify-center gap-1.5 group-hover:text-amber-100 transition-colors translate-y-[1px]">
                          RANDOM REGENERATE
                        </span>
                      </div>
                    </div>

                    {/* Soft red bookmark ribbon tail hanging from under the right border */}
                    <div className="absolute right-[5%] bottom-[-2px] w-2 h-[6px] bg-rose-600 rounded-b shadow-sm z-10 opacity-80 border border-rose-700 border-t-0" />
                  </button>
                </div>
              )}

            </div>

            {/* Swapped Goal Panel (Cetak Biru Sasaran) */}
            <div className="hidden xl:block">
              <GoalPanel targetGoal={gameState.targetGoal} />
            </div>

          </section>

          {/* =========================================================================
              RIGHT COLUMN (DESKTOP): Cardboard Grid & Inventory Dock
              ========================================================================= */}
          <section 
            id="board-desktop" 
            className={`lg:col-span-12 xl:col-span-8 flex flex-col items-center justify-start xl:justify-center space-y-2 xl:space-y-1.5 w-full xl:h-full xl:overflow-y-auto pt-2 xl:pt-2 pb-4
              ${mobileScreen === 'puzzle' ? 'flex' : 'hidden xl:flex'}
            `}
          >
            
            {/* Mobile Workspace Quick Back Button & Level Indicator Panel */}
            <div className="xl:hidden w-full max-w-[540px] flex items-center justify-between bg-[#FAF8F5]/90 border border-stone-300/80 p-1.5 px-2.5 rounded-md shadow-sm mb-2 mt-0.5 flex-none">
              <button
                id="btn-mobile-back"
                onClick={() => setMobileScreen('selection')}
                className="bg-stone-700 hover:bg-stone-850 text-white font-bold text-[10px] py-1 px-2.5 rounded hover:translate-y-[1px] transition active:translate-y-[2px] cursor-pointer flex items-center gap-1 shadow-sm"
              >
                ← Lemari Buku
              </button>
              <div className="text-right">
                <span className="text-[8px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                  {isCampaign ? `LEVEL ${currentLevelIndex + 1}` : 'TANTANGAN ACAK'}
                </span>
                <span className="text-[11px] font-bold text-[#8d6e63] font-sans leading-none block mt-0.5">
                  {isCampaign ? activeLevel.name : `${difficulty.toUpperCase()} MODE`}
                </span>
              </div>
            </div>
            
            {/* On mobile and tablet stack vertically to ensure spacious layouts and prevent overlapping; only on desktop align horizontally */}
            <div className="w-full flex flex-col gap-4 xl:gap-1 max-w-[540px] flex-initial">
              {/* Swapped Goal Panel - only visible on mobile & tablet, hidden on desktop */}
              <div className="xl:hidden w-full">
                <GoalPanel targetGoal={gameState.targetGoal} />
              </div>

              {/* The physical 3D box workbench */}
              <div className="w-full p-2 relative select-none flex justify-center flex-1">
                <CardboardGrid
                  gameState={gameState}
                  placeBlock={placeBlock}
                  removeBlockFromGrid={removeBlockFromGrid}
                  resetLevel={resetLevel}
                  undo={undo}
                  canUndo={history.length > 0}
                  currentMaxZ={currentMaxZ}
                  rotateBlock={rotateBlock}
                  hideControlsOnDesktop={true}
                  isTopView={isTopView}
                  toggleTopView={() => setIsTopView(!isTopView)}
                />
              </div>
            </div>

            {/* Separated Desktop Action Control Deck */}
            <div 
              id="desktop-actions-deck"
              className="hidden xl:flex items-center justify-center w-full max-w-[480px] mb-2 flex-none gap-2.5"
            >
              {gameState.selectedBlockId ? (
                <button
                  id="desk-btn-rotate-active"
                  onClick={() => rotateBlock(gameState.selectedBlockId!)}
                  disabled={gameState.rotationsLeft <= 0}
                  className={`px-4 py-1.5 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all select-none active:translate-y-0.5 cursor-pointer`}
                  title={`Putar Buku Pilihan. Sisa: ${gameState.rotationsLeft}x`}
                >
                  <RotateCw size={12} className={gameState.rotationsLeft > 0 ? "text-white animate-spin-slow" : "text-stone-300"} />
                  Putar ({gameState.rotationsLeft}x)
                </button>
              ) : (
                <button
                  id="desk-btn-rotate-disabled"
                  disabled
                  className="px-4 py-1.5 rounded border border-stone-200 bg-stone-100 text-stone-400 text-xs font-semibold flex items-center gap-1.5 select-none cursor-not-allowed opacity-60"
                  title="Pilih buku dalam tas untuk diputar"
                >
                  <RotateCw size={12} className="text-stone-300" />
                  Putar ({gameState.rotationsLeft}x)
                </button>
              )}

              <button
                id="desk-btn-undo"
                onClick={undo}
                disabled={history.length === 0}
                className={`px-4 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all select-none border border-stone-300
                  ${history.length > 0
                    ? 'bg-white hover:bg-neutral-50 text-stone-700 active:translate-y-[1px] cursor-pointer'
                    : 'bg-stone-50 text-stone-400 border-stone-250 cursor-not-allowed opacity-50'}
                `}
                title="Batalkan langkah"
              >
                <Undo2 size={12} className={history.length > 0 ? "text-stone-500" : "text-stone-400"} />
                Batal
              </button>

              <button
                id="desk-btn-reset"
                onClick={resetLevel}
                className="bg-white border border-stone-300 px-4 py-1.5 rounded shadow-sm text-xs font-semibold text-stone-700 hover:bg-neutral-50 active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                title="Ulangi level ini"
              >
                <RefreshCw size={12} className="text-stone-500" />
                Ulang
              </button>

              <button
                id="desk-btn-toggle-view"
                onClick={() => setIsTopView(!isTopView)}
                className={`bg-white border px-4 py-1.5 rounded shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px]
                  ${isTopView ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-stone-300 text-stone-700 hover:bg-neutral-50'}`}
                title="Tampilan"
              >
                <Eye size={12} className={isTopView ? 'text-indigo-600' : 'text-stone-500'} />
                {isTopView ? 'Samping' : 'Atas'}
              </button>
            </div>

            {/* Shelf/Inventory inventory map */}
            <Inventory
              inventory={gameState.inventory}
              selectedBlockId={gameState.selectedBlockId}
              selectBlock={selectBlock}
              rotateBlock={rotateBlock}
            />

          </section>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className={`max-w-7xl mx-auto px-4 mt-2 sm:mt-4 pb-2 text-center text-[10px] text-stone-500 font-sans tracking-widest uppercase flex-none ${mobileScreen === 'puzzle' ? 'hidden xl:block' : 'block'}`}>
        <p>© 2026 BiblioLogic • RaFive - Juara Vibe Coding</p>
      </footer>

      {/* =========================================================================
          VICTORY COMPLETE MODAL CELEBRATION (AnimatePresence)
          ========================================================================= */}
      <AnimatePresence>
        {isWon && (
          <div className="fixed inset-0 w-full h-full left-0 top-0 bg-stone-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              id="victory-celebration-modal"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative bg-[#FFFCF5] border border-[#E9E4DC] shadow-sm rounded-sm p-0 text-center max-w-[410px] w-full overflow-hidden m-auto"
            >
              {/* Spiral notebook holes */}
              <div className="absolute top-2.5 left-0 right-0 w-full flex justify-around px-2 opacity-60 z-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#E8E3DA] shadow-inner shrink-0 mx-1" />
                ))}
              </div>
              
              {/* Top margin line */}
              <div className="absolute top-[56px] left-0 right-0 h-[2px] bg-red-400/25 z-0"></div>
              
              <div 
                className="pt-[56px] px-8 relative z-10 w-full flex flex-col items-center select-none"
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(168, 162, 158, 0.25) 27px, rgba(168, 162, 158, 0.25) 28px)', 
                  lineHeight: '28px',
                  backgroundAttachment: 'local',
                  minHeight: '224px'
                }}
              >
                {/* Big completion trophy */}
                <div className="w-[56px] h-[56px] bg-[#FDFBF7] rounded-[2px] flex items-center justify-center border-2 border-stone-400 border-dashed shadow-sm bg-white/50 mb-[28px] -rotate-2">
                  <Award size={30} className="text-stone-600 animate-bounce" />
                </div>

                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest bg-stone-200/50 px-3 h-[28px] leading-[28px] rounded-[2px] border border-stone-300 border-dashed font-bold z-10 mb-[28px] rotate-1">
                  Level Selesai!
                </p>

                <h2 className="font-serif italic text-[18px] font-bold text-stone-750 tracking-wide px-2 h-[28px] leading-[28px]">
                  Sempurna! Susunan rapi!
                </h2>

                <p className="text-[13.5px] font-medium text-stone-700 h-[28px] leading-[28px] mb-[28px] px-2">
                  Buku-buku telah disusun sesuai cetak biru.
                </p>

                <div className="flex gap-4 w-full justify-center h-[84px] pt-[14px]">
                  <button
                    id="btn-victory-reset"
                    onClick={resetLevel}
                    className="flex-1 max-w-[120px] h-[40px] text-xs text-stone-700 bg-transparent hover:bg-stone-200/50 border-[2px] border-stone-500 border-dashed rounded-[255px_15px_225px_15px/15px_225px_15px_255px] transition active:scale-95 font-bold cursor-pointer rotate-1"
                  >
                    Main Lagi
                  </button>
                  <button
                    id="btn-victory-next"
                    onClick={handleNextLevel}
                    className="flex-1 max-w-[120px] h-[40px] text-stone-800 bg-stone-200/50 hover:bg-stone-300/60 border-[2px] border-stone-800 border-dashed rounded-[15px_255px_15px_225px/225px_15px_255px_15px] transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 font-bold -rotate-1"
                  >
                    <span>Lanjut</span>
                    <ChevronRight size={14} className="stroke-[3px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
