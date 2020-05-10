/** Commonly used utility functions */
export class Utility {

    /**
     * Adds zero padding to given number.
     * @param num Number
     * @param size Length of returning string
     */
    public static pad(num, size) {
        return ('000000000' + num).substr(-size);
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
        return arr;
    }

}
