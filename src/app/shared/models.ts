/** Essential individual job */
export interface Job {
    /** Time at the completion of job */
    End: number;
    /** Name or the index of job */
    Name: any;
    /** Processing time of job: the time needed to complete the job. */
    ProcessTime: number;
    /** Time at the start of job */
    Start: number;
}

/** Flowshop problem solution */
export class Solution {
    /** Total makespan of problem */
    Makespan: number;
    /** Solution sequence of jobs */
    Sequence: number[];
    /** Each machine x job proces in the solution */
    Jobs: Job[][];

    constructor(sequence: number[]) {
        this.Makespan = undefined;
        this.Jobs = [];
        this.Sequence = sequence;
    }
}
