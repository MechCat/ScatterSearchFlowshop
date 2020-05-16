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
