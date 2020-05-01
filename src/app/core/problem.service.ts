import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solution } from '../shared/models';

/** ProblemService */
@Injectable({
  providedIn: 'root'
})
export class ProblemService {

  /** Problem representation instance */
  problem: Problem = {
    BoundLower: undefined,
    BoundUpper: undefined,
    NumberOfMachines: 0,
    NumberOfJobs: 0,
    Name: '',
    ProcessingTimes: []
  };

  constructor(private http: HttpClient) { }

  /**
   * Calculates solution makespan.
   * @param sequence Solution sequence of jobs
   * @return Makespan of given solution
   */
  evaluateSolution(sequence: number[]): number {
    const sol = new Solution(sequence);

    for (let i = 0; i < this.problem.NumberOfMachines; i++) {
      const startTimesOfCurrentMachine = [];
      const endTimesOfCurrentMachine = [];

      if (i === 0) {  // 1st machine
        let jobStart = 0;
        for (let j = 0; j < this.problem.NumberOfJobs; j++) {
          const jobEnd = jobStart + this.problem.ProcessingTimes[0][sequence[j]]; // prep. & cleaning times here if needed
          jobStart = jobEnd;
          startTimesOfCurrentMachine.push(jobStart);
          endTimesOfCurrentMachine.push(jobEnd);
        }
      } else { // other machines
        for (let j = 0; j < this.problem.NumberOfJobs; j++) {
          let jobStart;
          const endOfPrevMachine = sol.TimeEnds[i - 1][j];
          const endOfPrevJob = (endTimesOfCurrentMachine[j - 1] !== undefined) ? endTimesOfCurrentMachine[j - 1] : 0;

          if (endOfPrevJob > endOfPrevMachine)
            jobStart = endOfPrevJob;
          else
            jobStart = endOfPrevMachine;
          const jobEnd = jobStart + this.problem.ProcessingTimes[i][sequence[j]];  // prep. & cleaning times here if needed

          startTimesOfCurrentMachine.push(jobStart);
          endTimesOfCurrentMachine.push(jobEnd);
        }
      }
      sol.TimeStarts.push(startTimesOfCurrentMachine);
      sol.TimeEnds.push(endTimesOfCurrentMachine);
    }
    console.log('solution:', sol);
    return sol.TimeEnds[this.problem.NumberOfMachines - 1][this.problem.NumberOfJobs - 1];
  }

  /** Reads the problem names listed in assets...problems.json */
  getProblemNames() {
    return this.http.get('assets/problems/problems.json');
  }

  /**
   * Sets problem instance according to given problem string.
   * Parsing is set to read Taillard's problem format (examples: assets/problems/taXXX.txt).
   * @param filetext Contents of problem file in string format
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
    this.problem.NumberOfJobs = Number(tempProperties[0]);
    this.problem.NumberOfMachines = Number(tempProperties[1]);
    this.problem.BoundUpper = Number(tempProperties[3]);
    this.problem.BoundLower = Number(tempProperties[4]);

    for (let i = 3; i < rows.length; i++) { // starting from the rows[3] where processing times are
      const tempArr = rows[i].match(/[0-9]+/g);
      this.problem.ProcessingTimes.push(tempArr.map(x => Number(x)));
    }
    console.log(this.problem);
  }

  /**
   * Reads the problem file and returns as string.
   * @param problemFileName File name of the selected problem
   */
  readProblem(problemFileName: string): Observable<string> {
    return this.http.get('../assets/problems/' + problemFileName, { responseType: 'text' }).pipe();
  }

  /** Resets problem instance to default empty values */
  resetProblem() {
    this.problem.BoundUpper = undefined;
    this.problem.BoundLower = undefined;
    this.problem.Name = '';
    this.problem.NumberOfJobs = 0;
    this.problem.NumberOfMachines = 0;
    this.problem.ProcessingTimes = [];
  }
}

export interface Problem {
  /** Lower bound of the makespans */
  BoundLower: number;
  /** Upper bound of the optimal makespans (best value E. Taillard's gotten) */
  BoundUpper: number;
  /** Problem name */
  Name: string;
  /** Number of jobs */
  NumberOfJobs: number;
  /** Number of machines */
  NumberOfMachines: number;
  /** Processing times of each job on each machine */
  ProcessingTimes: any[];
}
