export default function range(start: number, end?: number, step = 1) {
  const from = end === undefined ? 0 : start;
  const to = end === undefined ? start : end;
  const values: number[] = [];

  if (step === 0) return values;

  if (from < to) {
    for (let value = from; value < to; value += step) {
      values.push(value);
    }
  } else {
    for (let value = from; value > to; value -= Math.abs(step)) {
      values.push(value);
    }
  }

  return values;
}

