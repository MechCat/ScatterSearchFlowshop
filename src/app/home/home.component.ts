import { Component, OnInit } from '@angular/core';
import { ProblemService } from '../core/problem.service';

/** HomeComponent */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** List of problem names */
  problemList: string[] = [];

  constructor(private ps: ProblemService) { }

  /** ngOnInit */
  ngOnInit() {
    this.ps.getProblemNames().subscribe(x => {
      // tslint:disable-next-line: no-string-literal
      this.problemList = x['problems'];
    });
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
    // alert('success!');
    console.log('func test');
    const seq = [1, 2, 0];
    const makespan = this.ps.evaluateSolution(seq);
    console.log('seq:', seq, 'makespan: ', makespan);
  }

}
