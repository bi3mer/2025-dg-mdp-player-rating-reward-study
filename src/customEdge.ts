import { Edge } from "./GDM-TS/src/Graph/edge";

export class CustomEdge extends Edge {
  link: string[]

  constructor(src: string, tgt: string, probability: Array<[string, number]>, link: string[]) {
    super(src, tgt, probability);
    this.link = link;
  }
}
