declare const Matter: any;
declare const Tone: any;
declare const drawingContext: CanvasRenderingContext2D & {
  shadowBlur: number;
  shadowColor: string;
};

declare const width: number;
declare const height: number;
declare const windowWidth: number;
declare const windowHeight: number;
declare const TWO_PI: number;
declare const HALF_PI: number;
declare const CENTER: number;
declare const CORNER: number;
declare const CLOSE: number;

declare function createCanvas(w: number, h: number): void;
declare function resizeCanvas(w: number, h: number): void;
declare function pixelDensity(v: number): void;
declare function rectMode(mode: number): void;
declare function noStroke(): void;
declare function fill(v1: number | string, v2?: number, v3?: number, alpha?: number): void;
declare function rect(x: number, y: number, w: number, h: number, radius?: number): void;
declare function circle(x: number, y: number, d: number): void;
declare function push(): void;
declare function pop(): void;
declare function translate(x: number, y: number): void;
declare function rotate(angle: number): void;
declare function beginShape(): void;
declare function endShape(mode?: number): void;
declare function vertex(x: number, y: number): void;
declare function textAlign(h: number, v: number): void;
declare function textSize(size: number): void;
declare function text(content: string, x: number, y: number): void;
declare function map(
  value: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number,
  withinBounds?: boolean
): number;
declare function constrain(value: number, min: number, max: number): number;
declare function random<T>(array: T[]): T;
declare function random(min: number, max: number): number;
declare function cos(angle: number): number;
declare function sin(angle: number): number;

interface Window {
  setup: () => void;
  draw: () => void;
  windowResized: () => void;
}
