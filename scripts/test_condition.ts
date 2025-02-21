import {
  LD_DIFFICULTY,
  LD_ENJOYMENT,
  LD_MEAN,
  LD_RANDOM,
  LD_SWITCH,
} from "../src/constants";
import { LevelDirector } from "../src/levelDirector";

const ld = new LevelDirector(LD_ENJOYMENT);

const NUM_LEVELS = 2;
const idToCount = {};

for (let i = 0; i < 20; ++i) {
  ld.get(NUM_LEVELS);
  ld.update(true, 0);
  for (let jj = 0; jj < NUM_LEVELS; ++jj) {
    const lvlName = ld.keys[jj];
    if (lvlName in idToCount) {
      ++idToCount[lvlName];
    } else {
      idToCount[lvlName] = 1;
    }
  }
}

let ids = Object.keys(idToCount);
for (let i = 0; i < ids.length; ++i) {
  console.log(`${ids[i]}: ${idToCount[ids[i]]}`);
}
