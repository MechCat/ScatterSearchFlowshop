/** Flowshop problem solution */
export class Solution {
    /** Total makespan of problem */
    Makespan: number;
    /** Solution sequence of jobs */
    Sequence: number[];
    /** Timestamp of each job start */
    TimeStarts: number[][];
    /** Timestamp of each job end */
    TimeEnds: number[][];

    constructor(sequence: number[]) {
        this.Makespan = undefined;
        this.Sequence = sequence;
        this.TimeStarts = [];
        this.TimeEnds = [];
    }
}
