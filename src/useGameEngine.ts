/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { Color, Difficulty, Position, BookBlock, GameState, Level } from './types';

// Helper to create empty 3D grid [x][y][z] of size 3x3x3
const createEmptyGrid = (): (BookBlock | null)[][][] => {
  return Array(3).fill(null).map(() =>
    Array(3).fill(null).map(() =>
      Array(3).fill(null)
    )
  );
};

// Helper to create empty Color grid
const createEmptyColorGrid = (): (Color | null)[][][] => {
  return Array(3).fill(null).map(() =>
    Array(3).fill(null).map(() =>
      Array(3).fill(null)
    )
  );
};

// Global rotate helper to ensure 100% consistent 90-deg CW mathematical transformations
const rotateShapeGlobal = (shape: Position[], rotationsCount: number): Position[] => {
  let rotated = [...shape];
  for (let r = 0; r < rotationsCount; r++) {
    rotated = rotated.map(p => ({ x: -p.y, y: p.x, z: p.z }));
  }
  if (rotated.length > 0) {
    const ax = rotated[0].x;
    const ay = rotated[0].y;
    const az = rotated[0].z;
    rotated = rotated.map(p => ({
      x: p.x - ax,
      y: p.y - ay,
      z: p.z - az
    }));
  }
  return rotated;
};

// Normalize shape by shifting elements to origin and sorting coordinates
const normalizeShape = (shape: Position[]): Position[] => {
  if (shape.length === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  for (const p of shape) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.z < minZ) minZ = p.z;
  }
  return shape.map(p => ({
    x: p.x - minX,
    y: p.y - minY,
    z: p.z - minZ
  })).sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return a.y - b.y;
    return a.z - b.z;
  });
};

// Check if two shapes have identical coordinates after normalization (taking orientation/symmetry into account)
const areShapesEqual = (s1: Position[], s2: Position[]): boolean => {
  const n1 = normalizeShape(s1);
  const n2 = normalizeShape(s2);
  if (n1.length !== n2.length) return false;
  for (let i = 0; i < n1.length; i++) {
    if (n1[i].x !== n2[i].x || n1[i].y !== n2[i].y || n1[i].z !== n2[i].z) {
      return false;
    }
  }
  return true;
};

// Calculate the absolute minimum number of CW rotations to change baseShape to targetOrientedShape
const getMinRotationsForBlock = (baseShape: Position[], targetOrientedShape: Position[]): number => {
  for (let r = 0; r < 4; r++) {
    const rotated = rotateShapeGlobal(baseShape, r);
    if (areShapesEqual(rotated, targetOrientedShape)) {
      return r;
    }
  }
  return 0; // fallback
};

// Seed-based Pseudo-Random Number Generator to ensure 100% deterministic (tetap) levels
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a pseudo-random floating-point value between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Choose a random element from an array deterministically
  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  // Choose a random integer between min (inclusive) and max (exclusive)
  randInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

// 30 Permanent level names matching Indonesian literary theme
const LEVEL_NAMES: Record<number, string> = {
  // EASY: 1-10
  1: "Saku Pertama (First Slot)",
  2: "Tumpukan Klasik (Classic Stack)",
  3: "Sudut Tenang (Cozy Corner)",
  4: "Arsip Dasar (Basic Archive)",
  5: "Rak Pemula (Novice Shelf)",
  6: "Sastra Harian (Daily Literature)",
  7: "Jurnal Lipat (Folded Journal)",
  8: "Kisi-Kisi Ringan (Light Grids)",
  9: "Kamus Saku (Pocket Dictionary)",
  10: "Catatan Kecil (Scrap Notes)",

  // MEDIUM: 11-20
  11: "Harmoni Biru (Blue Harmony)",
  12: "Tangga Buku (Book Staircase)",
  13: "Saling Kunci (Interlocking Files)",
  14: "Koridor Sedang (Medium Corridor)",
  15: "Susunan Simetri (Symmetric Layout)",
  16: "Sejarah Dunia (World History)",
  17: "Antologi Puisi (Poetry Anthology)",
  18: "Rak Bercabang (Branched Shelf)",
  19: "Ensiklopedia Alam (Nature Encyclopedia)",
  20: "Ruang Baca (Reading Room)",

  // HARD: 21-30
  21: "Menara Filosofi (Philosophy Tower)",
  22: "Piramida Mini (Mini Pyramid)",
  23: "Pustakawan Royal (Royal Librarian)",
  24: "Benteng Ilmu (Citadel of Knowledge)",
  25: "Labirin Aksara (Alphabet Labyrinth)",
  26: "Khazanah Kuno (Ancient Treasure)",
  27: "Arsip Raksasa (Giant Archive)",
  28: "Menara Kertas (Paper Spire)",
  29: "Monolit Teologi (Theology Monolith)",
  30: "Master Pustaka (Library Master)",
};

// Generates a fixed, 100% solvable level based on ID and difficulty
function generateDeterministicLevel(id: number, name: string, diff: Difficulty): Level {
  const rng = new SeededRandom(id * 149 + 104729); // Offset with safe prime seeds

  const SHAPES_EASY: Position[][] = [
    [{ x: 0, y: 0, z: 0 }], // Single
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // Flat Y duo
  ];

  const SHAPES_MEDIUM: Position[][] = [
    [{ x: 0, y: 0, z: 0 }], // Single
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], // Flat Y duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }], // Tall Z duo
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // L-shape flat trio
  ];

  const SHAPES_HARD: Position[][] = [
    [{ x: 0, y: 0, z: 0 }], // Single
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], // Flat Y duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }], // Tall Z duo
    [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 2 }], // Tall Z triple
    [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // L-shape flat trio
  ];

  const tryPlaceInTempGrid = (
    block: BookBlock,
    x: number,
    y: number,
    grid: (BookBlock | null)[][][],
    maxZ: number
  ): boolean => {
    const ax = block.shape[0]?.x ?? 0;
    const ay = block.shape[0]?.y ?? 0;

    for (const pos of block.shape) {
      const gx = x + (pos.x - ax);
      const gy = y + (pos.y - ay);
      if (gx < 0 || gx >= 3 || gy < 0 || gy >= 3) {
        return false;
      }
    }

    const columnsMap: Record<string, { gx: number; gy: number; segments: Position[] }> = {};
    block.shape.forEach(pos => {
      const gx = x + (pos.x - ax);
      const gy = y + (pos.y - ay);
      const key = `${gx}_${gy}`;
      if (!columnsMap[key]) {
        columnsMap[key] = { gx, gy, segments: [] };
      }
      columnsMap[key].segments.push(pos);
    });

    const placements: { gx: number; gy: number; gz: number }[] = [];

    for (const key of Object.keys(columnsMap)) {
      const { gx, gy, segments } = columnsMap[key];
      segments.sort((a, b) => a.z - b.z);

      let zFree = -1;
      for (let z = 0; z < maxZ; z++) {
        if (grid[gx][gy][z] === null) {
          zFree = z;
          break;
        }
      }

      if (zFree === -1) {
        return false;
      }

      for (let i = 0; i < segments.length; i++) {
        const gz = zFree + i;
        if (gz >= maxZ) {
          return false;
        }
        placements.push({ gx, gy, gz });
      }
    }

    placements.forEach(({ gx, gy, gz }) => {
      grid[gx][gy][gz] = block;
    });

    return true;
  };

  const maxZ = diff === 'easy' ? 1 : (diff === 'medium' ? 2 : 3);
  const targetBlockCount = diff === 'easy' ? 3 : (diff === 'medium' ? 5 : 7);

  const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
  const shapesPool = diff === 'easy' ? SHAPES_EASY : (diff === 'medium' ? SHAPES_MEDIUM : SHAPES_HARD);

  let success = false;
  let finalGrid = createEmptyGrid();
  let finalInventory: BookBlock[] = [];
  let calculatedRotationsLimit = 1;
  let attempts = 0;

  while (attempts < 200 && !success) {
    attempts++;
    const currentGrid = createEmptyGrid();
    const currentInventory: BookBlock[] = [];
    const blockPlacedShapes: { baseShape: Position[]; activeShape: Position[] }[] = [];
    let placedCount = 0;
    let failInside = false;

    for (let i = 0; i < targetBlockCount; i++) {
      const color = rng.choice(colors);
      const baseShape = rng.choice(shapesPool);
      const rotTimes = rng.randInt(0, 4);
      const activeShape = rotateShapeGlobal(baseShape, rotTimes);

      const tempBlock: BookBlock = {
        id: `lvl_${id}_b_${i + 1}`,
        color,
        shape: activeShape,
        isRotated: rotTimes * 90
      };

      let placedThisBlock = false;
      let placeAttempts = 0;
      while (placeAttempts < 45 && !placedThisBlock) {
        placeAttempts++;
        const rx = rng.randInt(0, 3);
        const ry = rng.randInt(0, 3);

        if (tryPlaceInTempGrid(tempBlock, rx, ry, currentGrid, maxZ)) {
          placedThisBlock = true;
        }
      }

      if (placedThisBlock) {
        placedCount++;
        currentInventory.push({
          id: tempBlock.id,
          color: tempBlock.color,
          shape: baseShape,
          isRotated: 0
        });
        blockPlacedShapes.push({
          baseShape,
          activeShape
        });
      } else {
        failInside = true;
        break;
      }
    }

    if (placedCount === targetBlockCount && !failInside) {
      finalGrid = currentGrid;
      finalInventory = currentInventory;
      
      // Calculate absolute minimum rotations required for this exact solution setup
      let totalMinRotations = 0;
      for (const bps of blockPlacedShapes) {
        totalMinRotations += getMinRotationsForBlock(bps.baseShape, bps.activeShape);
      }
      calculatedRotationsLimit = Math.max(1, totalMinRotations);
      success = true;
    }
  }

  // Pure fallback if generation somehow fails (never happens with high attempts)
  if (!success) {
    finalGrid = createEmptyGrid();
    finalInventory = [
      { id: `lvl_${id}_fb1`, color: 'red', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 },
      { id: `lvl_${id}_fb2`, color: 'blue', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 },
      { id: `lvl_${id}_fb3`, color: 'green', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 }
    ];
    tryPlaceInTempGrid(finalInventory[0], 0, 0, finalGrid, 1);
    tryPlaceInTempGrid(finalInventory[1], 1, 1, finalGrid, 1);
    tryPlaceInTempGrid(finalInventory[2], 2, 2, finalGrid, 1);
    calculatedRotationsLimit = 1;
  }

  const targetGoal = createEmptyColorGrid();
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        const b = finalGrid[x][y][z];
        if (b) {
          targetGoal[x][y][z] = b.color;
        }
      }
    }
  }

  return {
    id,
    name,
    difficulty: diff,
    targetGoal,
    inventory: finalInventory,
    rotationsLimit: calculatedRotationsLimit,
    description: `Level tetap ${name} (${diff.toUpperCase()}). Gunakan rotasi dan taktik gravitasi untuk menyusun tumpukan.`
  };
}

// Pre-defined static Campaign Levels (30 levels computed deterministically)
const CAMPAIGN_LEVELS: Level[] = [];
for (let id = 1; id <= 30; id++) {
  const name = LEVEL_NAMES[id] || `Misteri Sastra ${id}`;
  const diff: Difficulty = id <= 10 ? 'easy' : (id <= 20 ? 'medium' : 'hard');
  CAMPAIGN_LEVELS.push(generateDeterministicLevel(id, name, diff));
}

export function useGameEngine() {
  const [isCampaign, setIsCampaign] = useState<boolean>(true);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    inventory: [],
    selectedBlockId: null,
    targetGoal: createEmptyColorGrid(),
    rotationsLeft: 6,
  });
  const [initialRandomState, setInitialRandomState] = useState<GameState | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [history, setHistory] = useState<GameState[]>([]);

  const currentMaxZ = isCampaign ? 3 : (difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2 : 3));

  const undo = useCallback(() => {
    setHistory(prevHistory => {
      if (prevHistory.length === 0) return prevHistory;
      const previousState = prevHistory[prevHistory.length - 1];
      setGameState(previousState);
      return prevHistory.slice(0, -1);
    });
  }, []);

  // Initialize first level when starting Campaign
  useEffect(() => {
    if (isCampaign) {
      loadCampaignLevel(currentLevelIndex);
    } else {
      generateRandomLevelPlay(difficulty);
    }
  }, [isCampaign, currentLevelIndex, difficulty]);

  // Check victory condition whenever the grid changes
  useEffect(() => {
    let won = true;
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const gridColor = gameState.grid[x][y][z]?.color ?? null;
          const targetColor = gameState.targetGoal[x][y][z];
          if (gridColor !== targetColor) {
            won = false;
            break;
          }
        }
        if (!won) break;
      }
      if (!won) break;
    }
    setIsWon(won);
  }, [gameState.grid, gameState.targetGoal]);

  // Load static level
  const loadCampaignLevel = useCallback((index: number) => {
    const level = CAMPAIGN_LEVELS[index];
    if (!level) return;
    setGameState({
      grid: createEmptyGrid(),
      inventory: level.inventory.map(b => ({ ...b })), // Clone
      selectedBlockId: null,
      targetGoal: level.targetGoal,
      rotationsLeft: level.rotationsLimit,
    });
    setHistory([]);
    setIsWon(false);
  }, []);

  /**
   * =========================================================================
   * 5. LEVEL GENERATOR ALGORITHM (FORWARD GENERATION - SOLVABLE GUARANTEE)
   * =========================================================================
   * Logika ini menghasilkan level acak yang dijamin 100% dapat diselesaikan.
   * Langkah kerja:
   * 1. Mulai dengan grid kosong.
   * 2. Ambil tipe balok buku standard yang sesuai dengan tingkat kesulitan.
   * 3. Letakkan setiap balok satu per satu secara acak menggunakan simulasi mekanik
   *    gravitasi game yang sebenarnya. Jika gagal ditaruh, coba posisi atau rotasi lain.
   * 4. Jika semua balok sukses ditaruh, komposisi warna akhir dicatat sebagai 'targetGoal'.
   * 5. Pemain mendapatkan balok versi default/tidak terotasi di dalam inventory.
   * 6. Dengan cara ini, pasti ada minimal satu urutan pemasangan yang valid dan solvable!
   */
  const generateRandomLevelPlay = useCallback((diff: Difficulty) => {
    const SHAPES_EASY: Position[][] = [
      [{ x: 0, y: 0, z: 0 }], // Single
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // Flat Y duo
    ];

    const SHAPES_MEDIUM: Position[][] = [
      [{ x: 0, y: 0, z: 0 }], // Single
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], // Flat Y duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }], // Tall Z duo
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // L-shape flat trio
    ];

    const SHAPES_HARD: Position[][] = [
      [{ x: 0, y: 0, z: 0 }], // Single
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], // Flat X duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], // Flat Y duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }], // Tall Z duo
      [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 2 }], // Tall Z triple
      [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]  // L-shape flat trio
    ];

    const tryPlaceInTempGrid = (
      block: BookBlock,
      x: number,
      y: number,
      grid: (BookBlock | null)[][][],
      maxZ: number
    ): boolean => {
      const ax = block.shape[0]?.x ?? 0;
      const ay = block.shape[0]?.y ?? 0;

      for (const pos of block.shape) {
        const gx = x + (pos.x - ax);
        const gy = y + (pos.y - ay);
        if (gx < 0 || gx >= 3 || gy < 0 || gy >= 3) {
          return false;
        }
      }

      const columnsMap: Record<string, { gx: number; gy: number; segments: Position[] }> = {};
      block.shape.forEach(pos => {
        const gx = x + (pos.x - ax);
        const gy = y + (pos.y - ay);
        const key = `${gx}_${gy}`;
        if (!columnsMap[key]) {
          columnsMap[key] = { gx, gy, segments: [] };
        }
        columnsMap[key].segments.push(pos);
      });

      const placements: { gx: number; gy: number; gz: number }[] = [];

      for (const key of Object.keys(columnsMap)) {
        const { gx, gy, segments } = columnsMap[key];
        segments.sort((a, b) => a.z - b.z);

        let zFree = -1;
        for (let z = 0; z < maxZ; z++) {
          if (grid[gx][gy][z] === null) {
            zFree = z;
            break;
          }
        }

        if (zFree === -1) {
          return false;
        }

        for (let i = 0; i < segments.length; i++) {
          const gz = zFree + i;
          if (gz >= maxZ) {
            return false;
          }
          placements.push({ gx, gy, gz });
        }
      }

      placements.forEach(({ gx, gy, gz }) => {
        grid[gx][gy][gz] = block;
      });

      return true;
    };

    const maxZ = diff === 'easy' ? 1 : (diff === 'medium' ? 2 : 3);
    const targetBlockCount = diff === 'easy' ? 3 : (diff === 'medium' ? 5 : 7);

    const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
    const shapesPool = diff === 'easy' ? SHAPES_EASY : (diff === 'medium' ? SHAPES_MEDIUM : SHAPES_HARD);

    let attempts = 0;
    let success = false;
    let finalGrid = createEmptyGrid();
    let finalInventory: BookBlock[] = [];
    let calculatedRotationsLimit = 1;

    while (attempts < 100 && !success) {
      attempts++;
      const currentGrid = createEmptyGrid();
      const currentInventory: BookBlock[] = [];
      const blockPlacedShapes: { baseShape: Position[]; activeShape: Position[] }[] = [];
      let placedCount = 0;
      let failInside = false;

      for (let i = 0; i < targetBlockCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const baseShape = shapesPool[Math.floor(Math.random() * shapesPool.length)];
        const rotTimes = Math.floor(Math.random() * 4);
        const activeShape = rotateShapeGlobal(baseShape, rotTimes);

        const tempBlock: BookBlock = {
          id: `rand_b_${i + 1}`,
          color,
          shape: activeShape,
          isRotated: rotTimes * 90
        };

        let placedThisBlock = false;
        let placeAttempts = 0;
        while (placeAttempts < 30 && !placedThisBlock) {
          placeAttempts++;
          const rx = Math.floor(Math.random() * 3);
          const ry = Math.floor(Math.random() * 3);

          if (tryPlaceInTempGrid(tempBlock, rx, ry, currentGrid, maxZ)) {
            placedThisBlock = true;
          }
        }

        if (placedThisBlock) {
          placedCount++;
          currentInventory.push({
            id: tempBlock.id,
            color: tempBlock.color,
            shape: baseShape,
            isRotated: 0
          });
          blockPlacedShapes.push({
            baseShape,
            activeShape
          });
        } else {
          failInside = true;
          break;
        }
      }

      if (placedCount === targetBlockCount && !failInside) {
        finalGrid = currentGrid;
        finalInventory = currentInventory;
        
        let totalMinRotations = 0;
        for (const bps of blockPlacedShapes) {
          totalMinRotations += getMinRotationsForBlock(bps.baseShape, bps.activeShape);
        }
        calculatedRotationsLimit = Math.max(1, totalMinRotations);
        success = true;
      }
    }

    if (!success) {
      finalGrid = createEmptyGrid();
      finalInventory = [
        { id: 'fb_1', color: 'red', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 },
        { id: 'fb_2', color: 'blue', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 },
        { id: 'fb_3', color: 'green', shape: [{ x: 0, y: 0, z: 0 }], isRotated: 0 },
      ];
      tryPlaceInTempGrid(finalInventory[0], 0, 0, finalGrid, 1);
      tryPlaceInTempGrid(finalInventory[1], 1, 1, finalGrid, 1);
      tryPlaceInTempGrid(finalInventory[2], 2, 2, finalGrid, 1);
      calculatedRotationsLimit = 1;
    }

    const targetGoal = createEmptyColorGrid();
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const b = finalGrid[x][y][z];
          if (b) {
            targetGoal[x][y][z] = b.color;
          }
        }
      }
    }

    const initialS = {
      grid: createEmptyGrid(),
      inventory: finalInventory,
      selectedBlockId: null,
      targetGoal: targetGoal,
      rotationsLeft: calculatedRotationsLimit,
    };

    setGameState(initialS);
    setInitialRandomState(JSON.parse(JSON.stringify(initialS)));
    setHistory([]);
    setIsWon(false);
  }, []);

  // Memilih block dari inventory
  const selectBlock = useCallback((id: string | null) => {
    setGameState(prev => ({
      ...prev,
      selectedBlockId: prev.selectedBlockId === id ? null : id
    }));
  }, []);

  /**
   * =========================================================================
   * 4. MEKANIK GAMEPLAY (SUDUT ROTASI 90 DERAJAT)
   * =========================================================================
   * Ketika merotasi, koordinat X dan Y ditransformasi secara matematis:
   *   Rotasi 90 derajat searah jarum jam (Clockwise around Z-axis):
   *   x_baru = -y
   *   y_baru = x
   * Pustaka ini memodifikasi array shape dari BookBlock dengan formula presisi tersebut.
   */
  const rotateBlock = useCallback((id: string) => {
    if (gameState.rotationsLeft <= 0) return;

    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(gameState))]);

    setGameState(prev => {
      const updatedInventory = prev.inventory.map(block => {
        if (block.id !== id) return block;

        // Rotasikan setiap koordinat 90 derajat: (x, y, z) -> (-y, x, z)
        const updatedShape = block.shape.map(pos => ({
          x: -pos.y,
          y: pos.x,
          z: pos.z
        }));

        const newRotated = (block.isRotated + 90) % 360;

        return {
          ...block,
          shape: updatedShape,
          isRotated: newRotated
        };
      });

      return {
        ...prev,
        inventory: updatedInventory,
        rotationsLeft: prev.rotationsLeft - 1
      };
    });
  }, [gameState]);

  /**
   * =========================================================================
   * 4. MEKANIK GAMEPLAY (PLACEMENT & RIGID-BOODY GRAVITY SCAN)
   * =========================================================================
   * Mencari level Z terendah di kolom X, Y terpilih. Sesuai hukum gravitasi,
   * buku akan terus meluncur ke bawah (Z-indeks berkurang) sampai ia menyentuh
   * lantai dasar (Z=0) atau membentur buku lain yang bertumpuk di bawahnya.
   */
  const placeBlock = useCallback((x: number, y: number) => {
    if (!gameState.selectedBlockId) return false;

    const block = gameState.inventory.find(b => b.id === gameState.selectedBlockId);
    if (!block) return false;

    // Anchor sel pertama sebagai titik acuan letak klik kita
    const ax = block.shape[0]?.x ?? 0;
    const ay = block.shape[0]?.y ?? 0;

    // 1. Validasi batas grid horizontal
    for (const pos of block.shape) {
      const gx = x + (pos.x - ax);
      const gy = y + (pos.y - ay);
      if (gx < 0 || gx >= 3 || gy < 0 || gy >= 3) {
        return false;
      }
    }

    // 2. Petakan segmen berdasarkan kolom (gx, gy)
    const columnsMap: Record<string, { gx: number; gy: number; segments: { pos: Position; index: number }[] }> = {};

    block.shape.forEach((pos, index) => {
      const gx = x + (pos.x - ax);
      const gy = y + (pos.y - ay);
      const key = `${gx}_${gy}`;
      if (!columnsMap[key]) {
        columnsMap[key] = { gx, gy, segments: [] };
      }
      columnsMap[key].segments.push({ pos, index });
    });

    const targetPlacements: { gx: number; gy: number; gz: number; index: number }[] = [];

    // 3. Untuk setiap kolom, cari Z mendarat terendah yang bebas
    for (const key of Object.keys(columnsMap)) {
      const { gx, gy, segments } = columnsMap[key];
      // Urutkan segmen dari bawah ke atas berdasarkan pos.z relatif
      segments.sort((a, b) => a.pos.z - b.pos.z);

      // Cari Z_free terendah yang kosong di kolom ini
      let zFree = -1;
      for (let z = 0; z < 3; z++) {
        if (gameState.grid[gx][gy][z] === null) {
          zFree = z;
          break;
        }
      }

      if (zFree === -1) {
        return false; // Kolom penuh
      }

      // Hitung letak mendarat untuk setiap segmen di kolom ini
      for (let i = 0; i < segments.length; i++) {
        const gz = zFree + i;
        if (gz >= currentMaxZ) {
          return false; // Melebihi tinggi maksimum grid 3D untuk difficulty saat ini
        }
        targetPlacements.push({
          gx,
          gy,
          gz,
          index: segments[i].index
        });
      }
    }

    // Save to history before placing
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(gameState))]);

    // Lakukan penulisan ke Grid
    setGameState(prev => {
      const newGrid = prev.grid.map(layer => layer.map(row => [...row]));

      targetPlacements.forEach(({ gx, gy, gz }) => {
        newGrid[gx][gy][gz] = block;
      });

      // Hapus blok dari inventory
      const newInventory = prev.inventory.filter(b => b.id !== block.id);

      return {
        ...prev,
        grid: newGrid,
        inventory: newInventory,
        selectedBlockId: null // Matikan seleksi setelah diletakkan
      };
    });

    return true;
  }, [gameState, currentMaxZ]);

  // Mengambil kembali buku dari grid papan ke inventory (UX picking up)
  const removeBlockFromGrid = useCallback((blockId: string) => {
    // Cari object aslinya dari sel grid mana saja
    let foundBlock: BookBlock | null = null;
    
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          if (gameState.grid[x][y][z]?.id === blockId) {
            foundBlock = gameState.grid[x][y][z];
            break;
          }
        }
        if (foundBlock) break;
      }
      if (foundBlock) break;
    }

    if (!foundBlock) return;

    const blockToReturn = { ...foundBlock };

    // Save to history before removing
    setHistory(prevHistory => [...prevHistory, JSON.parse(JSON.stringify(gameState))]);

    setGameState(prev => {
      // 1. Bersihkan sel di grid yang berisi block ini
      const newGrid = prev.grid.map(layer =>
        layer.map(row =>
          row.map(cell => cell?.id === blockId ? null : cell)
        )
      );

      // 2. Tambahkan kembali ke inventory
      const newInventory = [...prev.inventory, blockToReturn];

      return {
        ...prev,
        grid: newGrid,
        inventory: newInventory,
        selectedBlockId: null
      };
    });
  }, [gameState]);

  // Reset keadaan level saat ini
  const resetLevel = useCallback(() => {
    setHistory([]);
    if (isCampaign) {
      loadCampaignLevel(currentLevelIndex);
    } else if (initialRandomState) {
      setGameState(JSON.parse(JSON.stringify(initialRandomState)));
      setIsWon(false);
    } else {
      generateRandomLevelPlay(difficulty);
    }
  }, [isCampaign, currentLevelIndex, difficulty, loadCampaignLevel, generateRandomLevelPlay, initialRandomState]);

  return {
    gameState,
    setGameState,
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
    campaignLevels: CAMPAIGN_LEVELS,
    loadCampaignLevel,
    generateRandomLevelPlay,
    history,
    undo,
    currentMaxZ
  };
}
