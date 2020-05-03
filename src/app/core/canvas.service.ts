import { Injectable } from '@angular/core';

/** Canvas service */
@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  /** Node coordinates' canvas equivalents */
  canvasCoords: Node[] = [];
  /** Canvas size */
  canvasSize = 640;
  /** To confine all coordinates in drawable area */
  canvasPadding = 20;
  /** Canvas layer1 context */
  layer1: CanvasRenderingContext2D;
  /** Canvas layer2 context */
  layer2: CanvasRenderingContext2D;
  /** Common canvas styles */
  styles = { guideline: 'rgba(0,0,255,0.1)' };

  constructor() { }

  /** Clears canvas */
  clearCanvas() {
    this.layer1.beginPath();
    this.layer1.clearRect(0, 0, this.canvasSize, this.canvasSize);
    this.clearBackground();
  }

  /** Clears only the background canvas. */
  clearBackground() {
    this.layer2.beginPath();
    this.layer2.clearRect(0, 0, this.canvasSize, this.canvasSize);
  }
}

interface Canvas {
  /** Canvas context */
  Context: CanvasRenderingContext2D;
  /** Edge length of canvas (square) */
  Size: number;
  /** Padding, used to confine all coordinates in drawable area with soft empty space before borders */
  Padding: number;
  /** Canvas representation [machine][job][startCoord, endCoord]. */
  Coords: Node[][][];
}
