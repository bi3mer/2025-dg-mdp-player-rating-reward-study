export function fischerYatesShuffle(array: any[]): void {
  let i = array.length - 1;
  for (; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));

    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}
