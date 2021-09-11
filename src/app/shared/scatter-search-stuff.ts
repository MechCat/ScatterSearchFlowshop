import { Utility } from './utililty';

/** Commonly used utility functions. */
export class SSStuff {

    /** Just generates, logs then terminates without solving */
    testParamGeneration() {
        const grandparams = [];
        const params = [];
        params.push('iter');
        params.push('pop');
        params.push('ref %');
        params.push('good %');
        params.push('bad %');
        params.push('ref');
        params.push('good');
        params.push('bad');
        grandparams.push(params);

        for (let i = 0; i < 10; i++) {
            const subparams = [];
            const iterLimit = Utility.random(60, 20);
            const popSize = Utility.random(200, 20);
            const refRatio = Utility.random(100, 1);
            const goodRefRatio = Utility.random(100);
            const badRefRatio = 100 - goodRefRatio;
            const refSize = Math.round(popSize * refRatio / 100);
            const goodRefSize = Math.round(refSize * goodRefRatio / 100);
            const badRefSize = Math.round(refSize * badRefRatio / 100);
            subparams.push(iterLimit);
            subparams.push(popSize);
            subparams.push(refRatio);
            subparams.push(goodRefRatio);
            subparams.push(badRefRatio);
            subparams.push(refSize);
            subparams.push(goodRefSize);
            subparams.push(badRefSize);
            grandparams.push(subparams);
        }
        grandparams.forEach(x => {
            x[2] = x[2] + '%';
            x[3] = x[3] + '%';
            x[4] = x[4] + '%';
        });
        console.log(grandparams);
        return;
    }
}
