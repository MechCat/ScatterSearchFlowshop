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

  resetProblem() { }

  selectProblem() {
    console.log(this.ps.problem.Name);
    let a = this.ps.readProblem(this.ps.problem.Name).subscribe(x => {
      console.log(x);
      this.ps.parseProblem(x);
    });

  }


  /** General testing function */
  test() {
    alert('success!');
  }

}
