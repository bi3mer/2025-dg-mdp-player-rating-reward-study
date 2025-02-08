import { Collider } from "../Components/Collider";
import { Enemy } from "../Components/Enemy";
import { Movable } from "../Components/Movable";
import { Player } from "../Components/Player";
import { Portal } from "../Components/Portal";
import { Render } from "../Components/Render";
import { Territory } from "../Components/Territory";
import { VisibleText } from "../Components/VisibleText";
import { CONTINUE, MAX_STAMINA, PLAYER_LOST } from "../constants";
import { Engine, Entity, Key, System } from "../WorldEngine/index";
import { Position2d } from "../WorldEngine/src/Components/Position2d";
import { Cookie } from "../WorldEngine/src/Utility";
import { GridCollisions } from "../WorldEngine/src/Utility/GridCollisions";
import { EnemyAI } from "./EnemyAI";
import { PlayerCollision } from "./PlayerCollision";
import { PlayerMovement } from "./PlayerMovement";
import { RenderEnemyTerritory } from "./RenderEnemyTerritory";
import { RenderGameInfo } from "./RenderGameInfo";

export class TutorialSystem extends System {
  componentsRequired = new Set<Function>([]);

  private steps: Array<[string, (engine: Engine, player: Entity) => boolean]> =
    [];
  private index: number = 0;

  private playerID: Entity;
  private textID: Entity;

  constructor(player: Entity, text: Entity) {
    super();
    const gc = new GridCollisions();

    this.playerID = player;
    this.textID = text;

    // move left
    this.steps.push([
      "Press 'A' to move your character, the '@' symbol, left.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.A) || engine.isKeyDown(Key.LEFT)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setX(pos.getX() - 1);
          return true;
        }

        return false;
      },
    ]);

    // move right
    this.steps.push([
      "Press 'D' to move your character right.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.D) || engine.isKeyDown(Key.RIGHT)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setX(pos.getX() + 1);
          return true;
        }

        return false;
      },
    ]);

    // move down
    this.steps.push([
      "Press 'S' to move your character down.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.S) || engine.isKeyDown(Key.DOWN)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setY(pos.getY() + 1);
          return true;
        }

        return false;
      },
    ]);

    // move up
    this.steps.push([
      "Press 'W' to move your character up.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.W) || engine.isKeyDown(Key.UP)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setY(pos.getY() - 1);
          return true;
        }

        return false;
      },
    ]);

    let s: Entity;
    let p: Entity;
    let e: Entity;
    const positionSwitch = new Position2d(20, 8);
    const positionPortal = new Position2d(30, 8);
    const positionEnemy = new Position2d(28, 8);

    this.steps.push([
      "Press ' ' (space) to spend one turn and not move.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.SPACE)) {
          // create boundary rectangle so player cannot exit the screen
          const MIN_X = 15;
          const MAX_X = 35;
          const MIN_Y = 3;
          const MAX_Y = 15;

          for (let x = MIN_X; x < MAX_X; ++x) {
            const top = this.ecs.addEntity();
            this.ecs.addComponent(top, new Position2d(x, MIN_Y));
            this.ecs.addComponent(top, new Collider());
            this.ecs.addComponent(top, new Render("X"));
            gc.set(new Position2d(x, MIN_Y), top);

            const bot = this.ecs.addEntity();
            this.ecs.addComponent(bot, new Position2d(x, MAX_Y));
            this.ecs.addComponent(bot, new Collider());
            this.ecs.addComponent(bot, new Render("X"));
            gc.set(new Position2d(x, MAX_Y), bot);
          }

          for (let y = MIN_Y; y <= MAX_Y; ++y) {
            const left = this.ecs.addEntity();
            this.ecs.addComponent(left, new Position2d(MIN_X, y));
            this.ecs.addComponent(left, new Collider());
            this.ecs.addComponent(left, new Render("X"));
            gc.set(new Position2d(MIN_X, y), left);

            const right = this.ecs.addEntity();
            this.ecs.addComponent(right, new Position2d(MAX_X, y));
            this.ecs.addComponent(right, new Collider());
            this.ecs.addComponent(right, new Render("X"));
            gc.set(new Position2d(MAX_X, y), right);
          }

          // add switch and portal
          s = this.ecs.addEntity();
          p = this.ecs.addEntity();
          e = this.ecs.addEntity();

          this.ecs.addComponent(s, positionSwitch);
          this.ecs.addComponent(s, new Render("*"));

          this.ecs.addComponent(p, new Portal());
          this.ecs.addComponent(p, positionPortal);
          this.ecs.addComponent(p, new Render("o"));
          this.ecs.addComponent(p, new Portal());

          this.ecs.setBB("grid collisions", gc);

          // add player movement system
          this.ecs.addSystem(5, new PlayerMovement());
          this.ecs.addSystem(10, new PlayerCollision());
          this.ecs.addSystem(50, new EnemyAI());
          this.ecs.addSystem(80, new RenderGameInfo());
          this.ecs.addSystem(85, new RenderEnemyTerritory());

          return true;
        }

        return false;
      },
    ]);

    // player hit switch
    this.steps.push([
      "That * is a switch. Run into it to open the portal.",
      (engine: Engine, player: Entity) => {
        const components = this.ecs.getComponents(this.playerID);
        const positionPlayer = components.get(Position2d);
        const playerComponent = components.get(Player);

        if (positionPlayer.equals(positionSwitch)) {
          this.ecs.removeEntity(s);
          this.ecs.getComponents(p).get(Render).character = "O";

          this.ecs.addComponent(e, positionEnemy);
          this.ecs.addComponent(e, new Render("#"));
          this.ecs.addComponent(
            e,
            new Enemy(
              "Enemy",
              new Position2d(positionEnemy.getX(), positionEnemy.getY()),
            ),
          );
          this.ecs.addComponent(e, new Territory(positionEnemy));
          this.ecs.addComponent(e, new Movable());

          return true;
        }

        if (playerComponent.stamina <= 0) {
          playerComponent.stamina = MAX_STAMINA;
          positionPlayer.setX(25);
          positionPlayer.setY(5);
          this.ecs.getComponents(this.textID).get(VisibleText).text =
            "Try to hit the '*' switch before you run out of stamina.";
        }

        return false;
      },
    ]);

    // player hit the portal
    this.steps.push([
      "Go through the opened portal, if you can...",
      (engine: Engine, player: Entity) => {
        const components = this.ecs.getComponents(this.playerID);
        const positionPlayer = components.get(Position2d);
        const p = components.get(Player);

        if (
          this.ecs.getBB("game over") == PLAYER_LOST ||
          p.stamina <= 0 ||
          positionPlayer.equals(positionEnemy)
        ) {
          // reset player position
          positionPlayer.setX(positionSwitch.getX());
          positionPlayer.setY(positionSwitch.getY());

          // reset enemy position
          positionEnemy.setX(28);
          positionEnemy.setY(8);

          // reset player stamina and game state
          p.stamina = MAX_STAMINA;
          this.ecs.setBB("game over", CONTINUE);

          // "helpful" hint for the player
          this.ecs.getComponents(this.textID).get(VisibleText).text =
            "Try to avoid the enemy and not run out of stamina!";
        }

        if (positionPlayer.equals(positionPortal)) {
          Cookie.set("completed tutorial", "true");
          console.log(Cookie.get("completed tutorial"));

          // TODO: tutorial logging

          return true;
        }

        return false;
      },
    ]);
  }

  update(engine: Engine, entities: Set<Entity>): void {
    if (this.steps[this.index][1](engine, this.playerID)) {
      ++this.index;

      if (this.index >= this.steps.length) {
        this.ecs.setBB("tutorial over", true);
      } else {
        this.ecs.getComponents(this.textID).get(VisibleText).text =
          this.steps[this.index][0];
      }
    }
  }
}
