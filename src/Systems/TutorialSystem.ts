
import { Engine, System, Entity, Key } from "../WorldEngine";
import { C } from "../Components";
import { Player } from "../Components/Player";
import { Position2d } from "../WorldEngine/src/Components";
import { Render } from "../Components/Render";
import { Portal } from "../Components/Portal";
import { PlayerMovement } from "./PlayerMovement";
import { PlayerCollision } from "./PlayerCollision";
import { RenderGameInfo } from "./RenderGameInfo";
import { RenderEnemyTerritory } from "./RenderEnemyTerritory";
import { EnemyAI } from "./EnemyAI";
import { Enemy } from "../Components/Enemy";
import { CONTINUE, MAX_STAMINA, PLAYER_LOST } from "../constants";
import { Territory } from "../Components/Territory";
import { Movable } from "../Components/Movable";
import { Cookie, GridCollisions } from "../WorldEngine/src/Utility";

export class TutorialSystem extends System {
  componentsRequired = new Set<Function>([]);

  private steps: Array<[string, (engine: Engine, player: Entity) => boolean]> = [];
  private index: number = 0;

  private playerID: Entity;
  private textID: Entity;

  constructor(player: Entity, text: Entity) {
    super();

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
      }
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
      }
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
      }
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
      }
    ]);


    // do nothing
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
          // add switch and portal
          s = this.ecs.addEntity();
          p = this.ecs.addEntity();
          e = this.ecs.addEntity();

          this.ecs.addComponent(s, positionSwitch);
          this.ecs.addComponent(s, new Render('*'));

          this.ecs.addComponent(p, new Portal());
          this.ecs.addComponent(p, positionPortal);
          this.ecs.addComponent(p, new Render('o'));
          this.ecs.addComponent(p, new Portal());

          const gc = new GridCollisions();
          this.ecs.setBB('grid collisions', gc);

          // add player movement system
          this.ecs.addSystem(5, new PlayerMovement());
          this.ecs.addSystem(50, new EnemyAI());
          this.ecs.addSystem(80, new RenderGameInfo());
          this.ecs.addSystem(85, new RenderEnemyTerritory());

          return true;
        }

        return false;
      }
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
          this.ecs.getComponents(p).get(Render).character = 'O';

          this.ecs.addComponent(e, positionEnemy);
          this.ecs.addComponent(e, new Render('#'));
          this.ecs.addComponent(e, new Enemy("Enemy", new Position2d(positionEnemy.getX(), positionEnemy.getY())));
          this.ecs.addComponent(e, new Territory(positionEnemy));
          this.ecs.addComponent(e, new Movable());

          return true;
        }

        if (playerComponent.stamina <= 0) {
          playerComponent.stamina = MAX_STAMINA;
          positionPlayer.setX(25);
          positionPlayer.setY(5);
          this.ecs.getComponents(this.textID).get(C.Text).text = "Try to hit the '*' switch before you run out of stamina.";
        }

        return false;
      }
    ]);


    // player hit the portal
    this.steps.push([
      "Go through the opened portal, if you can...",
      (engine: Engine, player: Entity) => {
        const components = this.ecs.getComponents(this.playerID);
        const positionPlayer = components.get(Position2d);
        const p = components.get(Player);

        if (this.ecs.getBB('game over') == PLAYER_LOST || p.stamina <= 0 || positionPlayer.equals(positionEnemy)) {
          // reset player position
          positionPlayer.setX(positionSwitch.getX());
          positionPlayer.setY(positionSwitch.getY());
          
          // reset enemy position
          positionEnemy.setX(28);
          positionEnemy.setY(8);

          // reset player stamina and game state
          p.stamina = MAX_STAMINA;
          this.ecs.setBB('game over', CONTINUE);

          // "helpful" hint for the player
          this.ecs.getComponents(this.textID).get(C.Text).text = 'Try to avoid the enemy and not run out of stamina!';
        }

        if (positionPlayer.equals(positionPortal)) {
          Cookie.set('completed tutorial', 'true');
          console.log(Cookie.get('completed tutorial'));

          // TODO: tutorial logging

          return true;
        }

        return false;
      }
    ]);
  }

  update(engine: Engine, entities: Set<Entity>): void {
    if (this.steps[this.index][1](engine, this.playerID)) {
      ++this.index;

      if (this.index >= this.steps.length) {
        this.ecs.setBB('tutorial over', true);
      } else {
        this.ecs.getComponents(this.textID).get(C.Text).text = this.steps[this.index][0];
      }
    }

  }
}
