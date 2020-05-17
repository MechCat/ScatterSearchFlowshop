import { Component, OnInit, ViewChild } from '@angular/core';
import { ProblemService } from '../core/problem.service';
import { Utility } from '../shared/utililty';
import { GanttComponent } from '../gantt/gantt.component';
/** HomeComponent */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** Reference to Gannt Chart component. */
  @ViewChild(GanttComponent) private gantt: GanttComponent;

  /** List of problem names. */
  problemList: string[] = [];
  /** Disables UI and pops a spinner when **true.** */
  wait = false;

  sequence: number[] = [0, 1, 2];  // temporary***
  seqLabel: any = '0, 1, 2';  // temp***


  constructor(public ps: ProblemService) { }

  /** ngOnInit */
  ngOnInit() {
    this.ps.getProblemNames().subscribe(x => {
      // tslint:disable-next-line: no-string-literal
      this.problemList = x['problems'];
    });
  }

  /** Parses data from the selected problem text file. */
  selectProblem() {
    this.wait = true;
    this.ps.resetProblem();
    console.log('Selected problem:', this.ps.problem.name);
    this.ps.readProblem(this.ps.problem.name).subscribe(x => {
      console.log(x);
      this.ps.parseProblem(x);
      this.wait = false;
    });
  }


  /** General testing function */
  test() {
    console.log('func test');
  }

  /** Randomizes test solution sequence */
  testRandomize() {
    this.wait = true;
    this.sequence = [];
    for (let i = 0; i < this.ps.problem.numberOfJobs; i++) {
      this.sequence.push(i);
    }
    this.sequence = Utility.shuffle(this.sequence);
    this.seqLabel = this.sequence.toString();
    const solution = this.ps.evaluateSolution(this.sequence);
    console.log('seq:', this.sequence, 'makespan: ', solution.makespan);
    this.gantt.drawGanttChart(solution);
    this.wait = false;
  }

}
