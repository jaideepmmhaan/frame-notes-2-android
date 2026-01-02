export type Theme = 'dark' | 'pink' | 'royal';

export type BlockType = 'text' | 'image' | 'video';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string; // Text content or Base64 media
  width?: number;
  height?: number;
  drawings?: DrawingPath[]; // Annotations overlay
}

export interface Note {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  blocks: Block[];
  isPinned: boolean;
  isHidden?: boolean;
  theme?: Theme;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
}