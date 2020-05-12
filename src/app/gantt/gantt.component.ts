import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Utility } from '../shared/utililty';
import { Job, Solution } from '../shared/models';

/** Gantt Component */
@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit, AfterViewInit {

  /** Canvas reference */
  @ViewChild('layer1', { static: false }) canvasElem: ElementRef;
  /** Canvas background layer reference */
  @ViewChild('layer2', { static: false }) canvasElem2: ElementRef;

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

  /** ngOnInit */
  ngOnInit() { }

  /** Size canvas' after view inits */
  ngAfterViewInit(): void {
    this.prepareCanvas();
  }

  /** Clears canvas. */
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

  /**
   * Draws the flowshop solution.
   * @param solution Problem solution: containing job start-fin times, sequence, makespan etc.
   */
  drawGanttChart(solution: Solution) {
    this.setCanvasSize(solution.Jobs.length);
    this.setCanvasCoordinates(solution.Jobs, solution.Makespan);
    this.drawGuidelines(10, 23);
    this.drawJobBlocks();
  }

  /**
   * Draws labels and time marks along the axis' of chart.
   * @param lineCount Number of guidelines.
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

  /** Draws job blocks. */
  drawJobBlocks() {
    this.layer1.strokeStyle = this.styles.border;
    for (let m = 0; m < this.jobBlocks.length; m++) {
      for (let j = 0; j < this.jobBlocks[m].length; j++) {
        this.drawRect(
          this.jobBlocks[m][j].x,
          (this.jobBlockGap + this.jobBlockHeight) * (m + 1),
          this.jobBlocks[m][j].w,
          this.jobBlockHeight,
          this.jobBlocks[m][j].Color
        );
      }
    }
  }

  /**
   * Draws a rectangle representing a job on Gantt chart.
   * @param x starting X coordinate.
   * @param y starting Y coordinate.
   * @param w width of rectangle.
   * @param h height of rectangle.
   * @param color color of rectangle fill.
   */
  drawRect(x: number, y: number, w: number, h: number, color: string) {
    this.layer1.fillStyle = color;
    this.layer1.beginPath();
    this.layer1.fillRect(x, y, w, h);
    this.layer1.rect(x, y, w, h);
    this.layer1.stroke();
  }

  /**
   * Detects index of the job block the mouse is on.
   * @param event Mouse event
   */
  onMouseMove(event: MouseEvent) {
    const bounds = this.canvasElem.nativeElement.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (let m = 0; m < this.jobBlocks.length; m++) {
      for (let i = this.jobBlocks[m].length - 1; i >= 0; i--) {
        const b = this.jobBlocks[m][i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          console.log(m, i);
          break;
        }
      }
    }
  }

  /** Prepares canvas' dimensions. */
  prepareCanvas() {
    this.canvasWidth = window.innerWidth;
    this.layer1 = (this.canvasElem.nativeElement as HTMLCanvasElement).getContext('2d');
    this.layer1.canvas.height = this.canvasHeight;
    this.layer1.canvas.width = this.canvasWidth;
    this.layer2 = (this.canvasElem2.nativeElement as HTMLCanvasElement).getContext('2d');
    this.layer2.canvas.height = this.canvasHeight;
    this.layer2.canvas.width = this.canvasWidth;
  }

  /**
   * Translates job start/end times to canvas coordinates.
   * @param jobs Solution job list with schedule times.
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
          x: Math.round(jobs[m][j].Start * scaleIndex) + this.canvasPadding,
          y: (this.jobBlockGap + this.jobBlockHeight) * (m + 1),
          w: Math.round(jobs[m][j].ProcessTime * scaleIndex),
          h: this.jobBlockHeight,
          Color: colors[j]
        };
        row.push(jobBlock);
      }
      this.jobBlocks.push(row);
    }
    console.log('drawing scaleIndex', scaleIndex);
    console.log('jobBlocks', this.jobBlocks);
  }

  /**
   * Sets canvas height to span all machines.
   * @param machineCount Number of machines in the problem.
   */
  setCanvasSize(machineCount) {
    this.canvasHeight = (this.jobBlockHeight + this.jobBlockGap) * (machineCount + 2);
    this.canvasWidth = window.innerWidth;
  }
}

interface JobBlock {
  /** Starting X coordinate. */
  x: number;
  /** Starting Y coordinate. */
  y: number;
  /** Width of job block. */
  w: number;
  /** Height of job block. */
  h: number;
  /** Color of block. */
  Color: string;
}
