import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ProblemService } from '../core/problem.service';
import { Utility } from '../shared/utililty';
import { CanvasService } from '../core/canvas.service';
/** HomeComponent */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  /** List of problem names */
  problemList: string[] = [];

  sequence: number[] = [0, 1, 2];  // temporary***
  seqLabel: any = '0, 1, 2';  // temp***

  /** Canvas reference */
  @ViewChild('layer1', { static: false }) canvasElem: ElementRef;
  /** Canvas background layer reference */
  @ViewChild('layer2', { static: false }) canvasElem2: ElementRef;

  constructor(
    private cs: CanvasService,
    private ps: ProblemService
  ) { }

  /** ngOnInit */
  ngOnInit() {
    this.ps.getProblemNames().subscribe(x => {
      // tslint:disable-next-line: no-string-literal
      this.problemList = x['problems'];
    });
  }

  /** Size canvas' after view inits */
  ngAfterViewInit(): void {
    this.cs.layer1 = (this.canvasElem.nativeElement as HTMLCanvasElement).getContext('2d');
    this.cs.layer1.canvas.height = this.cs.canvasSize;
    this.cs.layer1.canvas.width = this.cs.canvasSize;
    this.cs.layer2 = (this.canvasElem2.nativeElement as HTMLCanvasElement).getContext('2d');
    this.cs.layer2.canvas.height = this.cs.canvasSize;
    this.cs.layer2.canvas.width = this.cs.canvasSize;
  }

  /** Parses data from the selected problem text file */
  selectProblem() {
    console.log('Selected problem:', this.ps.problem.Name);
    this.ps.readProblem(this.ps.problem.Name).subscribe(x => {
      console.log(x);
      this.ps.parseProblem(x);
    });
  }


  /** General testing function */
  test() {
    console.log('func test');
  }

  /** Randomizes test solution sequence */
  testRandomize() {
    this.sequence = Utility.shuffle(this.sequence);
    // this.sequence = [1, 2, 0];
    this.seqLabel = this.sequence.toString();
    const makespan = this.ps.evaluateSolution(this.sequence);
    console.log('seq:', this.sequence, 'makespan: ', makespan);
  }

}
