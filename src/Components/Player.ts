import { Component } from "../WorldEngine/";

export class Player extends Component {
  constructor(public stamina: number, public furthestColumn: number) {
    super();
  }
}
