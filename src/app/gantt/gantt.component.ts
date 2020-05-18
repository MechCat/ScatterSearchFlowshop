import { Component, OnInit, Inject } from '@angular/core';
import { Utility } from '../shared/utililty';
import { Job, Solution } from '../shared/models';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Gantt Component */
@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit {

  /** Canvas coordinates, corresponding to Jobs. */
  jobBlocks: JobBlock[][] = [];
  /** Canvas height. */
  canvasHeight = 0;
  /** To confine all coordinates in drawable area. */
  canvasPadding = 50;
  /** Canvas width. */
  canvasWidth = 800;
  /** Height of a job block. */
  jobBlockHeight = 16;
  /** Height between job blocks. */
  jobBlockGap = 8;
  /** Common styles. */
  styles = { border: 'hsla(0,0%,0%,1)', guideline: 'hsla(240,100%,50%,0.2)' };

  constructor(public dialog: MatDialog) { }

  /** ngOnInit */
  ngOnInit() { }

  /** Clears all svg sub-elements. */
  clear() {
    document.getElementById('axis').innerHTML = '';
    document.getElementById('guidelines').innerHTML = '';
    document.getElementById('labels').innerHTML = '';
    this.jobBlocks = [];
  }

  /**
   * Draws the flowshop solution.
   * @param solution Problem solution: containing job start-fin times, sequence, makespan etc.
   */
  drawGanttChart(solution: Solution) {
    this.clear();
    this.setCanvasSize(solution.jobs.length);
    this.setCanvasCoordinates(solution.jobs, solution.makespan);
    this.drawGuidelines(10, solution.makespan);
    // job blocks are drawn through ngFor using jobBlocks
  }

  /**
   * Draws labels and time marks along the axis' of chart.
   * @param lineCount Number of guidelines.
   * @param makespan Solution cost, used to label guidelines.
   */
  drawGuidelines(lineCount: number, makespan: number) {
    const chartArea = {
      Left: this.canvasPadding,
      Right: this.canvasWidth - this.canvasPadding,
      Top: this.jobBlockGap + this.jobBlockHeight,
      Bottom: (this.jobBlockGap + this.jobBlockHeight) * (this.jobBlocks.length + 1)  // Bottom includes job block padding as well...
    };

    //#region Axis
    // vertical axis
    this.svgLine(
      chartArea.Left - this.jobBlockGap, chartArea.Bottom,
      chartArea.Left - this.jobBlockGap, chartArea.Top - this.jobBlockGap,
      this.styles.border, 1, true, 'axis'
    );
    // horizontal axis
    this.svgLine(
      chartArea.Left - this.jobBlockGap, chartArea.Bottom,
      chartArea.Right + this.jobBlockGap, chartArea.Bottom,
      this.styles.border, 1, true, 'axis'
    );
    //#endregion

    //#region Guidelines & Labels
    const divideRatio = 1 / (lineCount - 1);
    // machines
    for (let i = 0; i < this.jobBlocks.length; i++) {
      const label = 'M' + Utility.pad(i, 3);
      this.svgText(
        label,
        (this.canvasPadding / 2) - this.jobBlockGap,
        (this.jobBlockGap + this.jobBlockHeight) * (i + 1) + (this.jobBlockGap + this.jobBlockHeight) / 2,
        this.styles.border, 'labels');
    }
    // times
    for (let i = 0; i < lineCount; i++) {
      const label = '' + Math.round(makespan * i * divideRatio * 100) / 100;
      const x = (this.canvasWidth - 2 * this.canvasPadding) * divideRatio * i + this.canvasPadding;
      // label
      this.svgText(label, x, this.canvasHeight - 5, this.styles.border, 'labels');
      // guideline
      this.svgLine(x, chartArea.Top, x, chartArea.Bottom, this.styles.guideline, 1, false, 'guidelines');
    }
    //#endregion
  }

  /**
   * Opens details for selected job.
   * @param job Job object containing times and job info.
   * @param order Sequence order of the job.
   * @param machine Current machine.
   */
  openDialog(job: JobBlock, order: number, machine: number): void {
    const dialogRef = this.dialog.open(GanttJobDetailDialogComponent, { data: { job, order, machine } });
  }

  /** Prepares canvas' dimensions. */
  prepareCanvas() {
    this.canvasWidth = window.innerWidth;
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
          x: Math.round(jobs[m][j].start * scaleIndex) + this.canvasPadding,
          y: (this.jobBlockGap + this.jobBlockHeight) * (m + 1),
          w: Math.round(jobs[m][j].processTime * scaleIndex),
          h: this.jobBlockHeight,
          color: colors[j],
          start: jobs[m][j].start,
          processTime: jobs[m][j].processTime,
          end: jobs[m][j].end,
          name: jobs[m][j].name,
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

  /**
   * Draws a line on the main svg.
   * @param x1 x1.
   * @param y1 y1.
   * @param x2 x2.
   * @param y2 y2.
   * @param stroke Stroke color.
   * @param strokeWidth Stroke width.
   * @param markerEnd Add an arrow marker at end of line.
   * @param target Target element id.
   */
  svgLine(x1, y1, x2, y2, stroke: string, strokeWidth, markerEnd: boolean, target: string) {
    const svg = document.getElementById(target);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttributeNS(null, 'x1', x1);
    line.setAttributeNS(null, 'y1', y1);
    line.setAttributeNS(null, 'x2', x2);
    line.setAttributeNS(null, 'y2', y2);
    line.setAttributeNS(null, 'stroke', stroke);
    line.setAttributeNS(null, 'stroke-width', strokeWidth);
    if (markerEnd)
      line.setAttributeNS(null, 'marker-end', 'url(#arrow)');
    line.classList.add('guideline');
    svg.appendChild(line);
  }

  /**
   * Draws a polygon on the main svg.
   * @param points Edges of the polygon (format eg: ['10,10', '50,20']).
   * @param stroke Stroke color.
   * @param fill Fill color.
   * @param target Target element id.
   */
  svgPolygon(points: string[], stroke: string, fill: string, target: string) {
    const svg = document.getElementById(target);
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    let p = '';
    points.forEach(e => {
      p += e + ' ';
    });
    polygon.setAttributeNS(null, 'points', p);
    polygon.setAttributeNS(null, 'stroke', stroke);
    polygon.setAttributeNS(null, 'fill', fill);
    svg.appendChild(polygon);
  }

  /**
   * Writes a text on the main svg.
   * @param text Text context.
   * @param x x.
   * @param y y.
   * @param fill Fill color.
   * @param target Target element id.
   */
  svgText(text: string, x, y, fill: string, target: string) {
    const svg = document.getElementById(target);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.innerHTML = text;
    t.setAttributeNS(null, 'x', x);
    t.setAttributeNS(null, 'y', y);
    t.setAttributeNS(null, 'fill', fill);
    t.setAttributeNS(null, 'text-anchor', 'middle');  // param these?
    t.setAttributeNS(null, 'font-size', '0.75rem'); // param these?
    svg.appendChild(t);
  }
}

/** Job Detail dialog component. */
@Component({
  selector: 'app-gantt-job-detail',
  templateUrl: 'job-detail.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttJobDetailDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<GanttJobDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data) { }

}

interface JobBlock extends Job {
  /** Starting X coordinate. */
  x: number;
  /** Starting Y coordinate. */
  y: number;
  /** Width of job block. */
  w: number;
  /** Height of job block. */
  h: number;
  /** Color of block. */
  color: string;
}
