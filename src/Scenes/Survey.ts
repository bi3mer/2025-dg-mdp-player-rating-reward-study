
import { QUESTIONS } from "../questions";
import { fischerYatesShuffle } from "../Random";
import { Engine, Scene } from "../WorldEngine";

export class Survey extends Scene {

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    // double shuffle because why not
    fischerYatesShuffle(QUESTIONS);
    fischerYatesShuffle(QUESTIONS);

    // get where we are going to place the survey
    const questionnaire = document.getElementById("questionnaire");

    // populate HTML with the questions
    let i = 0;
    for (; i < QUESTIONS.length; ++i) {
      const q = QUESTIONS[i];
      const id = q.split(' ').join('_');
      
      const formElement = `<fieldset>
      <label for="${id}"><b>${q}</b></label>
        <br/>
        <br/>
        <table>
          <tr>
            <td></td>
            <td>-3</td>
            <td>-2</td>
            <td>-1</td>
            <td>&#20;0</td>
            <td>&#20;1</td>
            <td>&#20;1</td>
            <td>&#20;2</td>
            <td></td>
          </tr>
          <tr>
            <td>Strongly disagree</td>
            <td><input type="radio" name="${id}" value="-3"/></td>
            <td><input type="radio" name="${id}" value="-2"/></td>
            <td><input type="radio" name="${id}" value="-1"/></td>
            <td><input type="radio" name="${id}" value="0"/></td>
            <td><input type="radio" name="${id}" value="1"/></td>
            <td><input type="radio" name="${id}" value="2"/></td>
            <td><input type="radio" name="${id}" value="3"/></td>
            <td>Strongly agree</td>
          </tr>
        </table>
      </fieldset>
      <br/>`;

      questionnaire!.innerHTML += formElement;
    }

    // hide game and make the survey visible
    document.getElementById('canvas')!.style.display = "none";
    document.getElementById('survey')!.style.display = "block";
  }

  public onExit(engine: Engine): void { }

  public update(engine: Engine): number {

    return -1;
  }
}
