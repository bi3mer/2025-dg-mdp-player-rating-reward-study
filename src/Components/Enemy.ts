import { Component, CommonComponents } from "../WorldEngine/";

export class Enemy extends Component {
  constructor(public type: string, public startPosition: CommonComponents.Position2d) {
    super();
  }
}
