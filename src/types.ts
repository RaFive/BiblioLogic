/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface BookBlock {
  id: string;
  color: Color;
  shape: Position[]; // Koordinat relatif blok buku penyusun pola ini
  isRotated: number;  // 0, 90, 180, 270 derajat
}

export interface GameState {
  grid: (BookBlock | null)[][][]; // Matriks 3D [x][y][z] ukuran 3x3x3
  inventory: BookBlock[];
  selectedBlockId: string | null;
  targetGoal: (Color | null)[][][]; // Pola akhir yang harus dicapai
  rotationsLeft: number; // Sisa rotasi yang diperbolehkan
}

export interface Level {
  id: number;
  name: string;
  difficulty: Difficulty;
  targetGoal: (Color | null)[][][];
  inventory: BookBlock[];
  description?: string;
  rotationsLimit: number;
}
