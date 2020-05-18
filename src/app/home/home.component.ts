import { Component, OnInit, ViewChild } from '@angular/core';
import { ProblemService } from '../core/problem.service';
import { Utility } from '../shared/utililty';
import { GanttComponent } from '../gantt/gantt.component';
import { Solution, TreeNode } from '../shared/models';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';

/** HomeComponent */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  /** Reference to Gannt Chart component. */
  @ViewChild(GanttComponent) private gantt: GanttComponent;

  /** Difference between the solution makespan and best-known makespan. */
  makespanDif = { difference: 0, percent: 0 };
  /** List of problem names. */
  problemList: string[] = [];
  /** Data source for the tree view of jobs. */
  resultTreeData = new MatTreeNestedDataSource<TreeNode>();
  /** Solution of the problem. */
  solution: Solution = new Solution([]);
  /** Tree controller. */
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  /** Disables UI and pops a spinner when **true.** */
  wait = false;

  seqLabel: any = '0, 1, 2';  // temp***

  constructor(public ps: ProblemService) { }

  /** ngOnInit */
  ngOnInit() {
    this.ps.getProblemNames().subscribe(x => {
      // tslint:disable-next-line: no-string-literal
      this.problemList = x['problems'];
    });
  }

  /**
   * Fills resultTreeData for tree view of jobs.
   * @param solution Solution of problem.
   */
  fillTreeData(solution: Solution) {
    const a: TreeNode[] = [];
    for (let m = 0; m < solution.jobs.length; m++) {
      const b: TreeNode = { name: 'M' + Utility.pad(m, 4), children: solution.jobs[m] };
      a.push(b);
    }
    this.resultTreeData.data = a;
  }

  /** Checks if children exists under a tree node. */
  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  /** Clears solution and related variables to initial state. */
  resetSolution() {
    this.gantt.canvasHeight = 0;
    this.gantt.clear();
    this.solution = new Solution([]);
    this.resultTreeData.data = [];
    this.makespanDif = { difference: 0, percent: 0 };
  }

  /** Parses data from the selected problem text file. */
  selectProblem() {
    this.wait = true;
    this.resetSolution();
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
    const sequence = [];
    for (let i = 0; i < this.ps.problem.numberOfJobs; i++) {
      sequence.push(i);
    }
    this.solution = new Solution(sequence);
    this.solution.sequence = Utility.shuffle(this.solution.sequence);
    this.seqLabel = this.solution.sequence.toString();
    this.solution = this.ps.evaluateSolution(this.solution.sequence);
    console.log('seq:', this.solution.sequence, 'makespan: ', this.solution.makespan);
    this.makespanDif.difference = this.ps.problem.boundLower - this.solution.makespan;
    this.makespanDif.percent = Math.round((this.makespanDif.difference * 100 / this.ps.problem.boundLower) * 100) / 100;
    this.gantt.drawGanttChart(this.solution);
    this.fillTreeData(this.solution);
    this.wait = false;
  }

}
