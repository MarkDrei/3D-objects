/** Global animation loop hooks + shared environment state. */
export type Ticker = (dt: number, t: number) => void;

const tickers: Ticker[] = [];

export function onTick(fn: Ticker) {
  tickers.push(fn);
}

export function runTickers(dt: number, t: number) {
  for (const fn of tickers) fn(dt, t);
}

export const env = {
  /** 0 = full day, 1 = full night */
  night: 0,
};
