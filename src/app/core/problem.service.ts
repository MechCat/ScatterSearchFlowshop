import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solution, Job } from '../shared/models';

/** ProblemService */
@Injectable({
  providedIn: 'root'
})
export class ProblemService {

  /** Problem representation instance. */
  problem: Problem = {
    boundLower: undefined,
    boundUpper: undefined,
    numberOfMachines: 0,
    numberOfJobs: 0,
    name: '',
    processingTimes: []
  };

  constructor(private http: HttpClient) { }

  /**
   * Evaluates and nominalizes the sequence.
   * @param sequence Solution sequence of jobs.
   * @returns Solution of the sequence (makespan, start/end times of each job on each machine).
   */
  evaluateSolution(sequence: number[]): Solution {
    const sol = new Solution(sequence);

    for (let i = 0; i < this.problem.numberOfMachines; i++) {
      const jobsOfCurrentMachine: Job[] = [];

      if (i === 0) {  // 1st machine
        let jobStart = 0;
        for (let j = 0; j < this.problem.numberOfJobs; j++) {
          const jobEnd = jobStart + this.problem.processingTimes[0][sequence[j]]; // prep. & cleaning times here if needed
          const job: Job = { start: jobStart, end: jobEnd, processTime: this.problem.processingTimes[0][sequence[j]], name: sequence[j] };
          jobsOfCurrentMachine.push(job);
          jobStart = jobEnd;
        }
      } else { // other machines
        for (let j = 0; j < this.problem.numberOfJobs; j++) {
          let jobStart;
          const endOfPrevMachine = sol.jobs[i - 1][j].end;
          const endOfPrevJob = (jobsOfCurrentMachine[j - 1] !== undefined) ? jobsOfCurrentMachine[j - 1].end : 0;

          if (endOfPrevJob > endOfPrevMachine)
            jobStart = endOfPrevJob;
          else
            jobStart = endOfPrevMachine;

          const jobEnd = jobStart + this.problem.processingTimes[i][sequence[j]];  // prep. & cleaning times here if needed
          const job: Job = { start: jobStart, end: jobEnd, processTime: this.problem.processingTimes[i][sequence[j]], name: sequence[j] };
          jobsOfCurrentMachine.push(job);
        }
      }
      sol.jobs.push(jobsOfCurrentMachine);
    }
    sol.makespan = sol.jobs[this.problem.numberOfMachines - 1][this.problem.numberOfJobs - 1].end;
    return sol;
  }

  /**
   * Calculates the makespan of given sequence.
   * @param sequence Sequence of jobs (can be partial or full).
   * @returns Makespan of the sequence.
   */
  evaluatePartialSequence(sequence: number[]): number {
    const ends: number[][] = [];
    for (let i = 0; i < this.problem.numberOfMachines; i++) {
      const endsOnCurrentMachine: number[] = [];

      if (i === 0) {  // 1st machine
        let jobStart = 0;
        for (let j = 0; j < sequence.length; j++) {
          const jobEnd = jobStart + this.problem.processingTimes[0][sequence[j]]; // prep. & cleaning times here if needed
          endsOnCurrentMachine.push(jobEnd);
          jobStart = jobEnd;
        }
      } else { // other machines
        for (let j = 0; j < sequence.length; j++) {
          let jobStart;
          const endOfPrevMachine = ends[i - 1][j];
          const endOfPrevJob = (endsOnCurrentMachine[j - 1] !== undefined) ? endsOnCurrentMachine[j - 1] : 0;

          if (endOfPrevJob > endOfPrevMachine)
            jobStart = endOfPrevJob;
          else
            jobStart = endOfPrevMachine;

          const jobEnd = jobStart + this.problem.processingTimes[i][sequence[j]];  // prep. & cleaning times here if needed
          endsOnCurrentMachine.push(jobEnd);
        }
      }
      ends.push(endsOnCurrentMachine);
    }
    return ends[this.problem.numberOfMachines - 1][sequence.length - 1];
  }

  /** Reads the problem names listed in assets...problems.json . */
  getProblemNames() {
    return this.http.get('./assets/problems/problems.json');
  }

  /**
   * Sets problem instance according to given problem string.
   * Parsing is set to read Taillard's problem format (examples: assets/problems/taXXX.txt).
   * @param filetext Contents of problem file in string format.
   */
  parseProblem(filetext: string) {
    // Example Tai file below (row#0: titles, row#1: properties, row#2: pTimes title, rest: processing times)
    /** number of jobs, number of machines, initial seed, upper bound and lower bound :
     *           20           5   873654221        1278        1232
     * processing times :
     *  54 83 15 71 77 36 53 38 27 87 76 91 14 29 12 77 32 87 68 94
     *  79  3 11 99 56 70 99 60  5 56  3 61 73 75 47 14 21 86  5 77
     *  16 89 49 15 89 45 60 23 57 64  7  1 63 41 63 47 26 75 77 40
     *  66 58 31 68 78 91 13 59 49 85 85  9 39 41 56 40 54 77 51 31
     *  58 56 20 85 53 35 53 41 69 13 86 72  8 49 47 87 58 18 68 28
     */
    const rows = filetext.split(/[\n]/);

    const tempProperties = rows[1].match(/[0-9]+/g);
    this.problem.numberOfJobs = Number(tempProperties[0]);
    this.problem.numberOfMachines = Number(tempProperties[1]);
    this.problem.boundUpper = Number(tempProperties[3]);
    this.problem.boundLower = Number(tempProperties[4]);

    for (let i = 3; i < rows.length; i++) { // starting from the rows[3] where processing times are
      const tempArr = rows[i].match(/[0-9.]+/g);
      this.problem.processingTimes.push(tempArr.map(x => Number(x)));
    }
    console.log(this.problem);
  }

  /**
   * Reads the problem file and returns as string.
   * @param problemFileName File name of the selected problem.
   */
  readProblem(problemFileName: string): Observable<string> {
    return this.http.get('./assets/problems/' + problemFileName, { responseType: 'text' }).pipe();
  }

  /** Resets problem instance to default empty values. */
  resetProblem() {
    this.problem.boundUpper = undefined;
    this.problem.boundLower = undefined;
    this.problem.numberOfJobs = 0;
    this.problem.numberOfMachines = 0;
    this.problem.processingTimes = [];
  }
}


export interface Problem {  // Refactor as Flowshop?
  /** Lower bound of the makespans. */
  boundLower: number;
  /** Upper bound of the optimal makespans (best value E. Taillard's gotten). */
  boundUpper: number;
  /** Problem name. */
  name: string;
  /** Number of jobs. */
  numberOfJobs: number;
  /** Number of machines. */
  numberOfMachines: number;
  /** Processing times of each job on each machine. 2 layered array: [m][j]*/
  processingTimes: any[];
}
