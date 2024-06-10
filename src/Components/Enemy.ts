import { ENEMY_RANGE } from "../constants";
import { Component, CommonComponents } from "../WorldEngine/";

export class Enemy extends Component {
  public territory: Array<CommonComponents.Position2d>;
  public startPosition: CommonComponents.Position2d;

  constructor(startPosition: CommonComponents.Position2d) {
    super();

    this.startPosition = startPosition;

    this.territory = [];
    for (let y = -ENEMY_RANGE; y <= ENEMY_RANGE; ++y) {
      for (let x = -ENEMY_RANGE; x <= ENEMY_RANGE; ++x) {
        const point = new CommonComponents.Position2d(x + startPosition.getX(), y + startPosition.getY());
        if (startPosition.euclideanDistance(point) <= ENEMY_RANGE) {
          this.territory.push(point);
        }
      }
    }
  }
}
