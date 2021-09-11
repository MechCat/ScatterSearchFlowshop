/** Essential individual job. */
export interface Job {
    /** Time at the completion of job. */
    end: number;
    /** Name or the index of job. */
    name: any;
    /** Processing time of job: the time needed to complete the job. */
    processTime: number;
    /** Time at the start of job. */
    start: number;
}

/** Flowshop problem solution. */
export class Solution {
    /** Total makespan of problem. */
    makespan: number;
    /** Solution sequence of jobs. */
    sequence: number[];
    /** Each machine x job proces in the solution. */
    jobs: Job[][];

    constructor(sequence: number[]) {
        this.makespan = undefined;
        this.jobs = [];
        this.sequence = sequence;
    }
}

/** Base parameters for scatter search algorithm. */
export interface SSParams {
    /** Population size: number of solutions (pops) in the algorithm. */
    popSize: number;
    /** Iteration Limit: how many times the algorithm should repeat itself. */
    iterLimit: number;
    /** Reference size: number of good solutions selected to proceed into combination method.  */
    goodRef: number;
    /** Reference size: number of diverse(eg. bad) solutions selected to proceed into combination method.  */
    diverseRef: number;
    /** Label for mat-select */
    label?: string;
}

/** Tree node for material tree. */
export interface TreeNode {
    /** Name of the node. */
    name: string;
    /** Children node. */
    children?: TreeNode[];
}
