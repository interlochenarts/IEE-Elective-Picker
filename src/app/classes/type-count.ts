export class TypeCount {
  type: string;
  count: number;
  periods: number[];

  constructor(t: string, c: number, p: number[]) {
    this.type = t;
    this.count = c;
    this.periods = p;
  }
}
