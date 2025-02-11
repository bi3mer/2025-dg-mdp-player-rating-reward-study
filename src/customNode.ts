import {
  LD_DIFFICULTY,
  LD_ENJOYMENT,
  LD_MEAN,
  LD_RANDOM,
  LD_SWITCH,
} from "./constants";
import { Node } from "./GDM-TS/src/Graph/node";
import { Global } from "./Global";

export class CustomNode extends Node {
  public visitedCount: number;
  public sumPercentCompleted: number;
  public depth: number;

  public difficulty: number;
  public enjoyability: number;

  constructor(
    name: string,
    difficulty: number,
    enjoyability: number,
    utility: number,
    isTerminal: boolean,
    neighbors: string[],
    depth: number,
  ) {
    super(name, difficulty, utility, isTerminal, neighbors);

    this.difficulty = difficulty;
    this.enjoyability = enjoyability;
    this.depth = depth;

    this.visitedCount = 1;
    this.sumPercentCompleted = 1;
  }

  public updateReward(optimizeDifficulty: boolean): void {
    switch (Global.director) {
      case LD_DIFFICULTY:
        this.reward = this.difficulty;
        break;
      case LD_ENJOYMENT:
        this.reward = this.enjoyability;
        break;
      case LD_RANDOM:
        break;
      case LD_MEAN:
        this.reward = (this.difficulty + this.enjoyability) / 2;
        break;
      case LD_SWITCH:
        this.reward = optimizeDifficulty ? this.difficulty : this.enjoyability;
        break;
      default:
        console.error(
          `Error: update reward on director "${Global.director}" not possible.`,
        );
        break;
    }

    this.reward /= this.visitedCount;
  }
}
