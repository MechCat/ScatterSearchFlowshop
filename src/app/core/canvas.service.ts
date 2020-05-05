import { Injectable } from '@angular/core';
import { Job } from '../shared/models';

/** Canvas service */
@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  /** Canvas coordinates, corresponding to Jobs */
  jobBlocks: JobBlock[][] = [];
  /** Canvas height */
  canvasHeight = 320;
  /** To confine all coordinates in drawable area */
  canvasPadding = 20;
  /** Canvas width */
  canvasWidth = 800;
  /** Height of a job block */
  jobBlockHeight = 20;
  /** Canvas layer1 context */
  layer1: CanvasRenderingContext2D;
  /** Canvas layer2 context */
  layer2: CanvasRenderingContext2D;
  /** Common canvas styles */
  styles = { guideline: 'hsla(240,100%,50%,0.1)', border: 'hsla(0,0%,0%,1)' };

  constructor() { }

  /** Clears canvas */
  clearCanvas() {
    this.layer1.beginPath();
    this.layer1.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.clearBackground();
  }

  /** Clears only the background canvas. */
  clearBackground() {
    this.layer2.beginPath();
    this.layer2.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /** Draws the flowshop solution stored in jobBlocks property */
  drawGanttScheme() {
    this.layer1.strokeStyle = this.styles.border;
    for (let m = 0; m < this.jobBlocks.length; m++) {
      for (let j = 0; j < this.jobBlocks[m].length; j++) {
        this.drawRect(
          this.jobBlocks[m][j].Start,
          2 * this.jobBlockHeight * (m + 1),
          this.jobBlocks[m][j].Width,
          this.jobBlockHeight,
          this.jobBlocks[m][j].Color
        );
      }
    }
  }

  /**
   * Draws a rectangle representing a job on Gantt chart.
   * @param x starting X coordinate
   * @param y starting Y coordinate
   * @param w width of rectangle
   * @param h height of rectangle (canvas height)
   * @param color color of rectangle fill
   */
  drawRect(x: number, y: number, w: number, h: number, color: string) {
    this.layer1.fillStyle = color;
    this.layer1.beginPath();
    this.layer1.fillRect(x, y, w, h);
    this.layer1.rect(x, y, w, h);
    this.layer1.stroke();
  }

  /**
   * Translates job start/end times to canvas coordinates
   * @param jobs Solution job list with schedule times
   * @param makespan Makespan of solution. Used as base to scale coordinates.
   */
  setCanvasCoordinates(jobs: Job[][], makespan: number) {
    const colors = [];
    jobs[0].forEach(e => {
      colors.push('hsl(' + Math.round(Math.random() * 120) * 3 + ', 50%,60%)'); // 120 colors
    });

    const scaleIndex = this.canvasWidth / makespan;

    for (let m = 0; m < jobs.length; m++) {
      const row: JobBlock[] = [];
      for (let j = 0; j < jobs[0].length; j++) {
        const jobBlock: JobBlock = {
          Start: Math.round(jobs[m][j].Start * scaleIndex),
          Width: Math.round(jobs[m][j].ProcessTime * scaleIndex),
          Color: colors[j]
        };
        row.push(jobBlock);
      }
      this.jobBlocks.push(row);
    }
    console.log('scaleIndex', scaleIndex);
    console.log('jobBlocks', this.jobBlocks);
  }

}

interface Canvas {
  /** Canvas context */
  Context: CanvasRenderingContext2D;
  /** Edge length of canvas (square) */
  Size: number;
  /** Padding, used to confine all coordinates in drawable area with soft empty space before borders */
  Padding: number;
  /** Canvas representation [machine][jobBlock]. */
  Coords: JobBlock[][];
}

interface JobBlock {
  /** Starting left coordinate */
  Start: number;
  /** Wıdth of job block */
  Width: number;
  /** Color of block */
  Color: string;
}
