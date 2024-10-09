import { MDP } from "../src/levels";

const NODE_KEYS = Object.keys(MDP.nodes);

const NUM_NODES = NODE_KEYS.length
const NUM_EDGES = Object.keys(MDP.edges).length;

console.log(`# nodes: ${NUM_NODES}`);
console.log(`AVG outgoing edges: ${NUM_EDGES / NUM_NODES}`);
