import { Component, OnInit, ViewChild } from '@angular/core';
import { ProblemService } from '../core/problem.service';
import { Utility } from '../shared/utililty';
import { GanttComponent } from '../gantt/gantt.component';
import { Solution, TreeNode } from '../shared/models';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { ScatterSearchService } from '../core/scatter-search.service';

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
  makespanDif = { lbDifference: 0, lbPercent: 0, ubDifference: 0, ubPercent: 0 };
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
  /** Shows contents of selected problem file. */
  showProblemData = false;

  constructor(public ps: ProblemService, public sss: ScatterSearchService) { }

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
    this.makespanDif = { lbDifference: 0, lbPercent: 0, ubDifference: 0, ubPercent: 0 };
  }

  /** Runs the Scatter Search algorithm via *sss* service. */
  scatterSearch() {
    { //#region  param gen (just generates, logs then terminates without solving)
      // let grandparams = [];
      // const params = [];
      // params.push('iter');
      // params.push('pop');
      // params.push('ref %');
      // params.push('good %');
      // params.push('bad %');
      // params.push('ref');
      // params.push('good');
      // params.push('bad');
      // grandparams.push(params);

      // for (let i = 0; i < 10; i++) {
      //   const subparams = [];
      //   const iterLimit = Utility.random(60, 20);
      //   const popSize = Utility.random(200, 20);
      //   const refRatio = Utility.random(100, 1);
      //   const goodRefRatio = Utility.random(100);
      //   const badRefRatio = 100 - goodRefRatio;
      //   const refSize = Math.round(popSize * refRatio / 100);
      //   const goodRefSize = Math.round(refSize * goodRefRatio / 100);
      //   const badRefSize = Math.round(refSize * badRefRatio / 100);
      //   subparams.push(iterLimit);
      //   subparams.push(popSize);
      //   subparams.push(refRatio);
      //   subparams.push(goodRefRatio);
      //   subparams.push(badRefRatio);
      //   subparams.push(refSize);
      //   subparams.push(goodRefSize);
      //   subparams.push(badRefSize);
      //   grandparams.push(subparams);
      // }
      // grandparams.forEach(x => {
      //   x[2] = x[2] + '%';
      //   x[3] = x[3] + '%';
      //   x[4] = x[4] + '%';
      // });
      // console.log(grandparams);
      // return;
    } //#endregion

    this.wait = !this.wait;
    const data: any = [['Makespan', 'Runtime (ms)', 'Max Iteration', 'PopSize', 'RefRatio', 'Good Ref Ratio', 'Diverse Ref Ratio',
      'RefSize', 'Good Ref Size', 'Diverse Ref Size', 'Sequence']];

    const sampleNo = 3000;

    for (let i = 0; i < sampleNo; i++) {
      // Assign params
      const iterLimit = Utility.random(60, 20);
      const popSize = Utility.random(200, 20);
      const refRatio = Utility.random(100, 1);
      const goodRefRatio = Utility.random(100);
      const badRefRatio = 100 - goodRefRatio;
      const refSize = Math.round(popSize * refRatio / 100);
      const goodRefSize = Math.round(refSize * goodRefRatio / 100);
      const badRefSize = refSize - goodRefSize; // = Math.round(refSize * badRefRatio / 100);
      console.log('params: iterLimit, popSize, refSize, goodRefSize, badRefSize:', iterLimit, popSize, refSize, goodRefSize, badRefSize);
      // alg. diagnostics
      this.sss.iterLimit = iterLimit;
      this.sss.popSize = popSize;
      this.sss.refSize.good = goodRefSize;
      this.sss.refSize.diverse = badRefSize;

      const startTime = Date.now();
      // algorithm
      this.solution = this.sss.scatterSearch(this.ps);
      // fin & push into data
      const rt = Date.now() - startTime;
      console.log('>>>>>> curIt:', i, 'makespan: ', this.solution.makespan, 'runtime: ', rt + ' ms');
      data.push([this.solution.makespan, rt, this.sss.iterLimit, popSize, refRatio, goodRefRatio, badRefRatio,
        refSize, goodRefSize, badRefSize, this.solution.sequence]);
    }
    // visual stuff
    this.makespanDif.lbDifference = this.ps.problem.boundLower - this.solution.makespan;
    this.makespanDif.lbPercent = Math.round((this.makespanDif.lbDifference * 100 / this.ps.problem.boundLower) * 100) / 100;
    this.makespanDif.ubDifference = this.ps.problem.boundUpper - this.solution.makespan;
    this.makespanDif.ubPercent = Math.round((this.makespanDif.ubDifference * 100 / this.ps.problem.boundUpper) * 100) / 100;
    this.gantt.drawGanttChart(this.solution);
    this.fillTreeData(this.solution);
    // output
    Utility.cvsOutput(data, this.ps.problem.name + ' results');
    this.wait = !this.wait;
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

}
