import { policyIteration } from "./GDM-TS";
import { Edge } from "./GDM-TS/src/Graph/edge";
import { choice } from "./GDM-TS/src/rand";
import { KEY_DEATH, KEY_START, NUM_ROWS, KEY_END } from "./constants";
import { CustomNode } from "./customNode";
import { MDP, idToLevel } from "./levels";
import { CustomEdge } from "./customEdge";

export class LevelDirector {
  public playerIsOnLastLevel: boolean = false;

  private keys: string[] = [];
  private columnsPerLevel: number[] = [];
  private lossesInARow: number = 0;
  private playerWonLastRound: boolean = false;
  private levelsPlayed: number = 0;
  private optimizeDifficulty: boolean = false;

  constructor() {
  }

  public update(playerWon: boolean, playerColumn: number): void {
    ++this.levelsPlayed;
    if (this.levelsPlayed % 5 == 0) {
      this.optimizeDifficulty = !this.optimizeDifficulty;
    }

    // Map out how far the player made it in the level
    const keysLength = this.keys.length;
    const percentCompleted: number[] = [];
    if (playerWon) {
      this.lossesInARow = 0;

      for (let i = 0; i < keysLength; ++i) {
        percentCompleted.push(1);
      }
    } else {
      let col = playerColumn;
      for (let i = 0; i < keysLength; ++i) {
        if (col > this.columnsPerLevel[i]) {
          percentCompleted[i] = 1;
          col -= this.columnsPerLevel[i];
        } else {
          percentCompleted[i] = col / this.columnsPerLevel[i];
          break;
        }
      }
    }

    // Update baed on how the player did
    const pcLength = percentCompleted.length;
    for (let i = 0; i < pcLength; ++i) {
      const pc = percentCompleted[i];
      const id = this.keys[i];
      const node = MDP.getNode(id) as CustomNode;

      // add edge if the segemnt was completed by the player
      if (pc === 1) {
        if (!MDP.hasEdge(KEY_START, id)) {
          console.log(`'adding edge: ${KEY_START} -> ${id}`);
          MDP.addEdge(new CustomEdge(KEY_START, id, [[id, 1.0], [KEY_DEATH, 0.0]], []));
        }
      }

      // update reward based on how the player did
      ++node.visitedCount;
      node.sumPercentCompleted += pc;

      node.updateReward(this.optimizeDifficulty);

      // update incoming edges life and death probability
      const probLife = node.sumPercentCompleted / node.visitedCount;
      const probDeath = 1 - probLife;
      MDP.mapEdges((e: Edge) => {
        if (e.tgt === id) {
          // There are always two entries. First is ideal target state and the
          // second is death.
          e.probability[0][1] = probLife;
          e.probability[1][1] = probDeath;
        }
      });
    }

    // This is the adaptive part of of adaptive policy iteration. See my
    // see my ADP paper (Level Assembly as a Markov Decision Process) for details.
    // Note that instead of reward or difficulty, we are concerned with maintaining
    // the structure of this smaller graph, so we use the depth of the node.
    if (!playerWon) {
      for (let i = 0; i < this.lossesInARow; ++i) {
        const neighbors = MDP.getNode(KEY_START).neighbors;
        const neighborsCount = neighbors.length;

        if (neighborsCount === 1) {
          break;
        }

        let hardestNeighbor = '';
        let maxSuccess = 10000; // TODO: rename
        let maxDifficulty = 0;
        for (let jj = 0; jj < neighborsCount; ++jj) {
          const nodeName = neighbors[jj];
          if (nodeName === '0_0_0') {
            continue; // skip tutorial / basic level
          }

          const n = MDP.getNode(nodeName) as CustomNode;
          const success = n.sumPercentCompleted / n.visitedCount;

          if (success < maxSuccess || (success === maxSuccess && maxDifficulty < n.difficulty)) {
            hardestNeighbor = nodeName;
            maxSuccess = success;
            maxDifficulty = n.difficulty;
          }
        }

        console.log('removing edge:', hardestNeighbor, maxSuccess);
        MDP.removeEdge(KEY_START, hardestNeighbor);
      }

      console.log('=======================');
    }

    this.playerWonLastRound = playerWon;
  }

  public get(levelSegments: number): string[] {
    const pi = policyIteration(MDP, 0.95, true, true, 20);
    this.columnsPerLevel = [];

    // If player won, don't start from a level that they have definitely 
    // already played
    if (this.playerWonLastRound) {
      this.keys = [choice(pi[KEY_START])];
    } else {
      this.keys = [KEY_START];
    }

    // USE MDP to create a policy and generate a new level
    for (let i = 0; i < levelSegments; ++i) {
      const k = choice(pi[this.keys[i]]);
      this.keys.push(k);

      if (k === KEY_END) {
        break;
      }
    }

    // remove START id from keys since we won't use it after this 
    this.keys.splice(0, 1);
    console.log(this.keys);

    // Update if the player is on the last level 
    this.playerIsOnLastLevel = this.keys.includes(KEY_END);

    // Populate the level
    let r: number;
    const lvl: string[] = Array(NUM_ROWS).fill("");
    const length = this.keys.length;

    for (let i = 0; i < length; ++i) { // skip the start key
      const stateLVL = idToLevel[this.keys[i]].slice(); // copy by value

      // add link if necessary. Note, we add it to state level so columnsPerLevel 
      // is correct
      if (i > 0) {
        const edge = MDP.getEdge(this.keys[i - 1], this.keys[i]) as CustomEdge;
        const link = edge.link;
        const linkLength = link.length;
        if (linkLength > 0) {
          for (let jj = 0; jj < linkLength; ++jj) {
            const column = link[jj]
            for (r = 0; r < NUM_ROWS; ++r) {
              stateLVL[r] = column[r] + stateLVL[r];
            }
          }
        }
      }

      this.columnsPerLevel.push(stateLVL[0].length);
      for (r = 0; r < NUM_ROWS; ++r) {
        lvl[r] += stateLVL[r];
      }
    }

    console.log(lvl.join("\n"));
    return lvl;
  }
}
