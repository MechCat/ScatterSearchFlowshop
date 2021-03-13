/** Commonly used utility functions. */
export class Utility {

    /**
     * Creates and downloads a cvs file using provided rows.
     * @param data Data rows in 2D (row x column).
     * @param fileName Name of the file.
     */
    public static cvsOutput(data: string[][], fileName: string) {
        // const data = [   // example data
        //   ["name1", "price1", "stock1"],
        //   ["name2", "price2", "stock2"]
        // ];

        const csvContent = 'data:text/csv;charset=utf-8,'
            + data.map(e => e.join(';')).join('\n');
        // (, => ;) https://en.wikipedia.org/wiki/Comma-separated_values#Example
        // ip check can be implemented to set comma or semicolon using https://extreme-ip-lookup.com/json/

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', fileName + '.csv');
        document.body.appendChild(link); // Required for FF

        setTimeout(() => { link.remove(); }, 5000); // remove element

        link.click(); // This will download the data file named "my_data.csv".
    }

    /**
     * Adds zero padding to given number.
     * @param num Number.
     * @param size Length of returning string.
     */
    public static pad(num, size) {
        return ('000000000' + num).substr(-size);
    }

    /**
     * Generates a random number between specified range. Params're inclusive.
     * @param max Maximum eligible number.
     * @param min Minimum eligible number (0 by default).
     * @returns  a random number between specified range.
     */
    public static random(max: number, min: number = 0) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Shuffles the provided array.
     * @param arr Array to be shuffled.
     */
    public static shuffle(arr: number[]) {
        let randomIndex: number;
        let tempVal: any;
        for (let i = arr.length - 1; i > 0; i--) {
            randomIndex = Math.round(Math.random() * (i));
            tempVal = arr[i];
            arr[i] = arr[randomIndex];
            arr[randomIndex] = tempVal;
        }
        return [...arr];
    }

}
