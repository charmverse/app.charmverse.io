export function randomIntFromInterval (min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// use this to generate smaller unique ids than uuid for storage
export function randomId () {
  return (Math.round(Date.now())).toString(36);
}
