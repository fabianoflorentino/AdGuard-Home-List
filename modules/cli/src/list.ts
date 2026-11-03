export class RuleList {
  private readonly rules = new Map<string, string[]>();

  public add(rule: string, origins: string[]): void {
    const existing = this.rules.get(rule);

    if (existing !== undefined) {
      for (const origin of origins) {
        if (!existing.includes(origin)) {
          existing.push(origin);
        }
      }

      return;
    }

    this.rules.set(rule, [...origins]);
  }

  public entries(): Array<[string, string[]]> {
    return [...this.rules.entries()].sort(([left], [right]) => {
      if (left < right) {
        return -1;
      }

      if (left > right) {
        return 1;
      }

      return 0;
    });
  }

  public get size(): number {
    return this.rules.size;
  }
}
