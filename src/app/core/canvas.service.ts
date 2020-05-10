import { Injectable } from '@angular/core';
import { Job } from '../shared/models';
import { Utility } from '../shared/utililty';

/** Canvas service */
@Injectable({
  providedIn: 'root'
})
export class CanvasService {  // (component instead of a service could be feasible for multiple problems)

  /** Canvas coordinates, corresponding to Jobs */
  jobBlocks: JobBlock[][] = [];
  /** Canvas height */
  canvasHeight = 320;
  /** To confine all coordinates in drawable area */
  canvasPadding = 40;
  /** Canvas width */
  canvasWidth = 800;
  /** Height of a job block */
  jobBlockHeight = 16;
  /** Height between job blocks */
  jobBlockGap = 8;
  /** Canvas layer1 context */
  layer1: CanvasRenderingContext2D;
  /** Canvas layer2 context */
  layer2: CanvasRenderingContext2D;
  /** Common canvas styles */
  styles = { border: 'hsla(0,0%,0%,1)', guideline: 'hsla(240,100%,50%,0.2)' };

  constructor() { }

  /** Clears canvas */
  clearCanvas() {
    this.layer1.beginPath();
    this.layer1.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.clearBackground();
    this.jobBlocks = [];
  }

  /** Clears only the background canvas. */
  clearBackground() {
    this.layer2.beginPath();
    this.layer2.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /** Draws the flowshop solution stored in jobBlocks property */
  drawGanttScheme() {
    this.drawGuidelines(10, 23);
    this.layer1.strokeStyle = this.styles.border;
    for (let m = 0; m < this.jobBlocks.length; m++) {
      for (let j = 0; j < this.jobBlocks[m].length; j++) {
        this.drawRect(
          this.jobBlocks[m][j].Start,
          (this.jobBlockGap + this.jobBlockHeight) * (m + 1),
          this.jobBlocks[m][j].Width,
          this.jobBlockHeight,
          this.jobBlocks[m][j].Color
        );
      }
    }
  }

  /**
   * Draws labels and time marks along the axis' of chart.
   * @param lineCount Number of guidelines
   * @param makespan Solution cost, used to label guidelines.
   */
  drawGuidelines(lineCount: number, makespan: number) {
    this.layer2.strokeStyle = this.styles.border;
    const chartArea = {
      Left: this.canvasPadding,
      Right: this.canvasWidth - this.canvasPadding,
      Top: this.jobBlockGap + this.jobBlockHeight,
      Bottom: (this.jobBlockGap + this.jobBlockHeight) * (this.jobBlocks.length + 1)  // Bottom includes job block padding as well...
    };

    //#region Axis
    // vertical axis
    this.layer2.beginPath();
    this.layer2.moveTo(chartArea.Left - this.jobBlockGap, chartArea.Top - this.jobBlockGap);
    this.layer2.lineTo(chartArea.Left - this.jobBlockGap, chartArea.Bottom); // ...so further add/subs not required.
    this.layer2.stroke();
    // horizontal axis
    this.layer2.beginPath();
    this.layer2.moveTo(chartArea.Left - this.jobBlockGap, chartArea.Bottom);
    this.layer2.lineTo(chartArea.Right + this.jobBlockGap, chartArea.Bottom);
    this.layer2.stroke();
    //#endregion

    //#region Guidelines & Labels
    // times
    const divideRatio = 1 / (lineCount - 1);
    // machines
    for (let i = 0; i < this.jobBlocks.length; i++) {
      const label = 'M' + Utility.pad(i, 3);
      this.layer2.fillText(label, 5, (this.jobBlockGap + this.jobBlockHeight) * (i + 1) + (this.jobBlockGap + this.jobBlockHeight) / 2);
    }
    for (let i = 0; i < lineCount; i++) {
      // label
      const label = '' + Math.round(makespan * i * divideRatio * 100) / 100;
      const x = (this.canvasWidth - 2 * this.canvasPadding) * divideRatio * i + this.canvasPadding;
      this.layer2.fillText(label, x, this.canvasHeight - 5);
      // guideline
      this.layer2.strokeStyle = this.styles.guideline;
      this.layer2.beginPath();
      this.layer2.moveTo(x, chartArea.Top);
      this.layer2.lineTo(x, chartArea.Bottom);
      this.layer2.stroke();
    }
    //#endregion
  }

  /**
   * Draws a rectangle representing a job on Gantt chart.
   * @param x starting X coordinate
   * @param y starting Y coordinate
   * @param w width of rectangle
   * @param h height of rectangle
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
      colors.push('hsl(' + Math.round(Math.random() * 90) * 4 + ', 50%,60%)'); // 90 colors
    });

    const scaleIndex = (this.canvasWidth - 2 * this.canvasPadding) / makespan;

    for (let m = 0; m < jobs.length; m++) {
      const row: JobBlock[] = [];
      for (let j = 0; j < jobs[0].length; j++) {
        const jobBlock: JobBlock = {
          Start: Math.round(jobs[m][j].Start * scaleIndex) + this.canvasPadding,
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

  /**
   * Sets canvas height to span all machines
   * @param machineCount Number of machines in the problem
   */
  setCanvasSize(machineCount) {
    this.canvasHeight = (this.jobBlockHeight + this.jobBlockGap) * (machineCount + 2);
    this.canvasWidth = window.innerWidth;
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
