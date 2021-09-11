import { Injectable } from '@angular/core';
import { Utility } from '../shared/utililty';
import { ProblemService } from './problem.service';
import { Solution } from '../shared/models';

/**
 * Implements Scatter Search algorithm on a provided problem.
 *
 * General algorithm steps & their implemantation on this service:
 *
 * 1. **Diversification Method:** generates a collection of diverse trial solutions,
 * using an arbitrary trial solution (or seed solution) as an input.
 *   * One solution is constructed using NEH algorithm to give a good-enough starting point,
 *     remaining solution sequences are constructed randomly.
 *
 * 2. **Improvement Method:** transform a trial solution into one or more enhanced trial solutions.
 *   * It is done with subjecting each solution to a local search algorithm.
 *
 * 3. **Reference Set Update Method:** builds and maintains a reference set consisting of the best
 * or * diverse solutions found.
 *   * Number of references are set with *refSize* parameter (open to user setting).
 *
 * 4. **Subset Generation Method:** operates on the reference set, to produce a subset of its
 * solutions as a basis for creating combined solutions.
 *   * Subsets in service consists of every dual combination of solution in the *refSet*.
 *
 * 5. **Solution Combination Method:** transforms a given subset of solutions produced by the
 * Subset Generation Method into one or more combined solution vectors.
 *   * Solutions in subsets are combined using Path Relinking algorithm which possibly produces more
 *     than one solution which are then evaluated and added into main population. Population then
 *     removes worse solution reducing it's size to *popSize* parameter.
 */
@Injectable({
  providedIn: 'root'
})
export class ScatterSearchService {

  // Scatter search algorithm PARAMETERS
  /** Population size: number of solutions (pops) in the algorithm. */
  public popSize = 30; // Optimal value for minimising makespan is 150 but takes far too long on large problems.
  /** Iteration Limit: how many times the algorithm should repeat itself. */
  public iterLimit = 20;
  /** Reference size: number of good and diverse(eg. bad) solutions selected to proceed into combination method.  */
  public refSize = { good: 14, diverse: 7 }; // Optimal ref size: 70% (of which 70% good ref, 30% bad ref) (suited for 150: 105, 70, 35)

  // Service variables
  /** Population of solutions. Each pop has a makespan and a job sequence. */
  private pops: Pop[] = [];
  /** Problem service: to read problem data and evaluation methods. */
  private ps: ProblemService;
  /** Sum of all job processing times on each machine. */
  private totalJobTimes: number[] = [];
  /** Solution derived from NEH algorithm. Needed to lead algorithm in a more optimal start. */
  private nehSolution: Pop = { makespan: undefined, sequence: [] };

  constructor() { }

  /**
   * Runs the algorithm steps in order.
   * @param ps Problem service provides flowshop methods (eg. makespan calc.) and problem data (eg. job times).
   * @returns The best solution found with scatter search.
   */
  public scatterSearch(ps: ProblemService): Solution {
    this.init(ps);
    this.improve();
    for (let itr = 0; itr < this.iterLimit; itr++) {
      const refSet = this.referenceSetUpdate();
      const subsets = this.subsetGeneration(refSet);
      this.combine(subsets);
      this.improve();
    }
    this.pops.sort((a, b) => a.makespan - b.makespan);  // sort pops after last improvement
    return this.ps.evaluateSolution(this.pops[0].sequence); // return the best
  }

  /**
   * Initializes the population via diversification method, sets some background variables.
   * @ps Problem service provides flowshop methods (eg. makespan calc.) and problem data (eg. job times).
   */
  private init(ps: ProblemService) {
    this.reset();
    this.ps = ps;

    //#region diversification method: completely randomized
    const jobList = [];
    for (let i = 0; i < this.ps.problem.numberOfJobs; i++) {
      jobList.push(i);
    }
    for (let i = 0; i < this.popSize - 1; i++) {  // diversification (-1: NEH is included just after)
      const tempSeq = Utility.shuffle([...jobList]);
      // this.pops.push(this.ps.evaluateSolution(tempSeq)); // when pt are needed (also change type to solution)
      this.pops.push({ makespan: this.ps.evaluatePartialSequence(tempSeq), sequence: tempSeq });
    }
    //#endregion

    //#region total job times calculation & NEH sequencing
    for (let j = 0; j < this.ps.problem.numberOfJobs; j++) { // total job times
      let count = 0;
      for (let m = 0; m < this.ps.problem.numberOfMachines; m++) {
        count += this.ps.problem.processingTimes[m][j];
      }
      this.totalJobTimes.push(count);
    }
    this.nehAlgorithm();
    this.pops.push(this.nehSolution);
    this.pops.push(this.palmersHeuristic());
    this.pops.push(this.spt());
    this.pops.push(this.cds());
    //#endregion
  }

  /**
   * Construct *nehSolution* using NEH algorithm (basically iterates through longest to shortest jobs
   * and accepts the best of combinations on each iteration).
   */
  private nehAlgorithm() {
    //#region #1 LPT job order
    const lpt: number[] = []; // jobs ordered by longest process times
    for (let i = 0; i < this.totalJobTimes.length; i++) {
      let worst = Number.MIN_SAFE_INTEGER;
      let tempIndex: number;
      for (let j = 0; j < this.totalJobTimes.length; j++) {
        if (this.totalJobTimes[j] > worst && !lpt.includes(j)) {
          worst = this.totalJobTimes[j];
          tempIndex = j;
        }
      }
      lpt.push(tempIndex);
    }
    //#endregion

    //#region  #2 NEH ordering
    this.nehSolution.sequence = [lpt[0]];
    for (let i = 1; i < lpt.length; i++) {
      const nextJob = lpt[i];
      let bestMakespan = Number.MAX_SAFE_INTEGER;
      let bestSeq = [];
      for (let j = 0; j <= i; j++) {
        const candidateSeq = [...this.nehSolution.sequence];
        candidateSeq.splice(j, 0, nextJob);
        const candidateMakespan = this.ps.evaluatePartialSequence(candidateSeq);

        if (candidateMakespan < bestMakespan) {
          bestMakespan = candidateMakespan;
          bestSeq = [...candidateSeq];
        }
      }
      this.nehSolution.sequence = [...bestSeq];
    }
    // this.nehSolution = this.ps.evaluateSolution(this.nehSolution.sequence);
    this.nehSolution.makespan = this.ps.evaluatePartialSequence(this.nehSolution.sequence);
    //#endregion
  }

  /**
   * Campbell, Dudek, Smith algorithm. Applies Johnson's rule for m>2 problems using surrogate problem steps.
   * https://www.researchgate.net/publication/336848617_Production_Time_Optimization_using_Campbell_Dudek_Smith_CDS_Algorithm_for_Production_Scheduling
   * @returns The pop with the best sequence and makespan found by algorithm.
   */
  private cds(): Pop {
    // #1 initialisation and 1st iteration (machine A: first & machine B: last).
    const sols: Pop[] = [];
    const ptm1: number[] = [...this.ps.problem.processingTimes[0]]; // first machine.
    const ptm2: number[] = [...this.ps.problem.processingTimes[this.ps.problem.numberOfMachines - 1]];  // last machine.
    sols.push(this.johnsonsRule(ptm1, ptm2));

    // #2 iterate till m-1 while adding neighboring machines times to mach A and mach B.
    for (let i = 0; i < this.ps.problem.numberOfMachines - 2; i++) {
      for (let j = 0; j < this.ps.problem.numberOfJobs; j++) {
        ptm1[j] += this.ps.problem.processingTimes[i + 1][j];
        ptm2[j] += this.ps.problem.processingTimes[this.ps.problem.numberOfMachines - 2 - i][j];
      }
      sols.push(this.johnsonsRule(ptm1, ptm2)); // apply Johnson's rule to every new duo.
    }
    sols.sort((a, b) => a.makespan - b.makespan); // sort by quality.
    return sols[0]; // return best solution.
  }

  /**
   * Applies Johnson's rule to two given process time set.
   * *(Used as a sub-function for CDS since most problems contain more than 2 machines)*.
   * @param ptm1 Process times of each job for 1st machine.
   * @param ptm2 Process times of each job for 2nd machine.
   * @returns A Pop with sequence and makespan.
   */
  private johnsonsRule(ptm1: number[], ptm2: number[]): Pop {
    const sol: Pop = { makespan: undefined, sequence: [] };
    const set1: number[] = [];
    const set2: number[] = [];

    for (let i = 0; i < ptm1.length; i++) {
      ptm1[i] < ptm2[i] ? set1.push(i) : set2.push(i);
      // if value's equal can be pushed into each set. Later check every variation?
      // Although equal number coulb be limitless and increase variation number logaritmic.
      // Solution proposal: if values're equal, flip a coin.
    }

    //#region order set1 using SPT
    const seq1 = []; // total process time per machine
    for (let i = 0; i < set1.length; i++) {
      const t = { index: set1[i], pt: ptm1[set1[i]] + ptm2[set1[i]] };
      seq1.push(t);
    }
    seq1.sort((a, b) => a.pt - b.pt);
    //#endregion

    //#region order set1 using LPT
    const seq2 = []; // total process time per machine
    for (let i = 0; i < set2.length; i++) {
      const t = { index: set2[i], pt: ptm1[set2[i]] + ptm2[set2[i]] };
      seq2.push(t);
    }
    seq2.sort((a, b) => b.pt - a.pt);
    //#endregion

    seq1.forEach(x => { sol.sequence.push(x.index); });
    seq2.forEach(x => { sol.sequence.push(x.index); });
    sol.makespan = this.ps.evaluatePartialSequence(sol.sequence);
    return sol;
  }

  /**
   * Palmer's (1965) version of the Johnson's rule to ‘m’ machine flow shop scheduling heuristics.
   * The heuristic calculates a slope index for each job and then schedules the jobs in descending order of the slope index.
   * @returns A Pop with sequence and makespan.
   */
  private palmersHeuristic(): Pop {
    const palmerSol: Pop = { makespan: undefined, sequence: [] };
    const slopeMatrix: number[][] = [];
    const slopes = [];
    // calc sub-slopes.
    for (let m = 0; m < this.ps.problem.numberOfMachines; m++) {
      const slope: number[] = [];
      const coef = 0 - (this.ps.problem.numberOfMachines - (2 * (m + 1) - 1));
      for (let j = 0; j < this.ps.problem.numberOfJobs; j++) {
        slope.push(this.ps.problem.processingTimes[m][j] * coef);
      }
      slopeMatrix.push(slope);
    }
    // sum sub-slopes to get each slope for jobs.
    for (let j = 0; j < this.ps.problem.numberOfJobs; j++) {
      let slopeVal = 0;
      for (let m = 0; m < this.ps.problem.numberOfMachines; m++) {
        slopeVal += slopeMatrix[m][j];
      }
      const jobSlope = { value: slopeVal, index: j };
      slopes.push(jobSlope);
    }
    slopes.sort((a, b) => b.value - a.value); // sort  in descending order.
    // construct pop.
    palmerSol.sequence = slopes.map(x => x.index);
    palmerSol.makespan = this.ps.evaluatePartialSequence(palmerSol.sequence);
    // console.log('slopes final ', slopes);
    // console.log('palmerSol', palmerSol);
    return palmerSol;
  }

  /**
   * Shortest processing time.
   * Constructs sequence according to the total processing times on a machine in **increasing order**.
   * @returns A Pop with sequence and makespan.
   */
  private spt(): Pop {
    const sptSol: Pop = { makespan: undefined, sequence: [] };
    const tjt = []; // total job times in spt context.
    for (let j = 0; j < this.totalJobTimes.length; j++) {
      const job = { pt: this.totalJobTimes[j], index: j };
      tjt.push(job);
    }
    tjt.sort((a, b) => a.pt - b.pt);
    sptSol.sequence = tjt.map(x => x.index);
    sptSol.makespan = this.ps.evaluatePartialSequence(sptSol.sequence);
    // console.log('tjt', tjt);
    // console.log('sptsol', sptSol);
    return sptSol;
  }

  /**
   * Improves pops by swapping them with new ones provided by local search algorithm
   * (swapping is done in *localSearch* if new solutions are actually better than previous pops).
   */
  private improve() {
    this.pops.forEach(pop => {
      this.localSearch(pop);
    });
  }

  /**
   * Applies local search to given pop. If the makespan is improved updates the pop.
   * Main objective of local search is to explore the neighboring solutions. To achieve this in
   * flowshop, a job's position is swapped with it's next job in each iteration.
   * @param pop The pop (solution, a member of population) to be improved.
   */
  private localSearch(pop: Pop) {
    const bestPop: Pop = { makespan: pop.makespan, sequence: [...pop.sequence] };
    for (let i = 0; i < pop.sequence.length - 1; i++) {
      const tempSequence: number[] = [...pop.sequence];
      const tempJob: number = tempSequence[i]; // swapping
      tempSequence[i] = tempSequence[i + 1];
      tempSequence[i + 1] = tempJob;
      const tempMakespan: number = this.ps.evaluatePartialSequence(tempSequence);
      if (tempMakespan < bestPop.makespan) {
        bestPop.makespan = tempMakespan;
        bestPop.sequence = [...tempSequence];
      }
    }
    pop.makespan = bestPop.makespan;
    pop.sequence = bestPop.sequence;
  }

  /**
   * Constructs reference set to be used in subset generation & combination.
   * @returns Array of pop indexes in the reference set.
   */
  private referenceSetUpdate(): number[] { // BEST 2 & WORST 1
    const referenceSet = [];

    //#region #1 finding the best
    for (let i = 0; i < this.refSize.good; i++) {
      let best = Number.MAX_SAFE_INTEGER;
      let tempIndex: number;
      for (let j = 0; j < this.pops.length; j++) {
        if (this.pops[j].makespan < best && !referenceSet.includes(j)) {
          best = this.pops[j].makespan;
          tempIndex = j;
        }
      }
      referenceSet.push(tempIndex);
    }
    //#endregion

    //#region #2 finding the diverse (the worst, as of now)
    for (let i = 0; i < this.refSize.diverse; i++) {
      let worst = Number.MIN_SAFE_INTEGER;
      let tempIndex: number;
      for (let j = 0; j < this.pops.length; j++) {
        if (this.pops[j].makespan > worst && !referenceSet.includes(j)) {
          worst = this.pops[j].makespan;
          tempIndex = j;
        }
      }
      referenceSet.push(tempIndex);
    }
    //#endregion

    return referenceSet;
  }

  /**
   * Generates subsets using the each dual combination of pops in *param referenceSet*.
   * @param referenceSet Indexes of the pops in referenceSet ()
   * @returns Subsets (each combination) of the referenceSet.
   */
  private subsetGeneration(referenceSet: number[]): number[][] {
    const subsets: number[][] = [];
    for (let i = 0; i < referenceSet.length; i++) {
      for (let j = i; j < referenceSet.length; j++) {
        if (i === j) continue;
        const subset: number[] = [];
        subset.push(referenceSet[i], referenceSet[j]);
        // subset.push(referenceSet[j]);
        subsets.push(subset);
      }
    }
    return subsets;
  }

  /**
   * Combines each solution duo in subsets using path relinking algorithm which possibly produces
   * multiple offsprings. Then makespan of these offsprings are calculated and offsprings are added
   * into the main population (*pops*). Population is then sorted by makespan and worse pops are removed
   * from population until population reaches *popSize* parameter.
   * @param subsets Sequences of selected parent pops (that are derived from subsetGen).
   */
  private combine(subsets: number[][]) {
    //#region #1: candidate evaluation
    const candidates: Pop[] = [];
    subsets.forEach(subset => { // fills candidates with every path between each subset duo.
      const paths: number[][] = this.pathRelinking(this.pops[subset[0]].sequence, this.pops[subset[1]].sequence);
      paths.forEach(path => {
        const candidate: Pop = { makespan: this.ps.evaluatePartialSequence(path), sequence: path };
        candidates.push(candidate);
      });
    });
    //#endregion

    //#region #2: push candidates into pops, sort, remove bad ones until pops are reduced to *popSize*
    candidates.forEach(c => { this.pops.push(c); });
    this.pops.sort((a, b) => a.makespan - b.makespan);
    this.pops.splice(this.popSize, this.pops.length - this.popSize);
    //#endregion
  }

  /**
   * Creates a route array leading from **source** to **target** changing one job at a time.
   * Main objective of path relinking is to explore neighboring solutions. Algorithm aims to transform
   * source sequence to the target sequence step by step: looks to target array and inserts correct job
   * into source array (while removing the job from previous position). This implementation uses
   * inserting instead of swapping.
   * @param source Source sequence.
   * @param target Target sequence: the end point source tries to look like.
   * @returns array of sequences leading from **source** to **target**.
   */
  private pathRelinking(source: number[], target: number[]): number[][] {
    source = [...source]; // preserve the original array.
    const path: number[][] = [];
    for (let i = 0; i < target.length; i++) {
      if (source[i] === target[i]) continue;
      const indexAtA: number = source.findIndex(x => x === target[i]);
      source.splice(indexAtA, 1);
      source.splice(i, 0, target[i]);
      path.push([...source]);
    }
    return path;
  }

  /** Resets some variables that others depend on. */
  private reset() {
    this.pops = [];
    this.nehSolution = { sequence: [], makespan: undefined };
    this.totalJobTimes = [];
  }
}

/** A member of algorithm population. */
interface Pop {
  /** Makespan of the member. */
  makespan: number;
  /** Sequence of the member. */
  sequence: number[];
}
