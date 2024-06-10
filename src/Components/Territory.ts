import { ENEMY_RANGE } from "../constants";
import { Component, CommonComponents } from "../WorldEngine/";

export class Territory extends Component {
  public territory: Array<CommonComponents.Position2d>;

  constructor(pos: CommonComponents.Position2d) {
    super();

    this.territory = [];
    for (let y = -ENEMY_RANGE; y <= ENEMY_RANGE; ++y) {
      for (let x = -ENEMY_RANGE; x <= ENEMY_RANGE; ++x) {
        const point = new CommonComponents.Position2d(x + pos.getX(), y + pos.getY());
        if (pos.euclideanDistance(point) <= ENEMY_RANGE) {
          this.territory.push(point);
        }
      }
    }
  }
}
