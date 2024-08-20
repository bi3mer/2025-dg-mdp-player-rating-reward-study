
import { DB } from "../Database";
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

      const formElement = `<fieldset id="${id}">
      <label for="${id}" required><b>${q}</b></label>
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
            <td>&#20;2</td>
            <td>&#20;3</td>
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


    // fill in years for birth year
    const yearForm = document.getElementById("year")!;
    for (var year = 1950; year < 2024; ++year) {
      var option = document.createElement('option');
      option.value = `${year}`;
      option.innerHTML = `${year}`;
      option.selected = (year == 1990);

      yearForm.appendChild(option);
    }

    // create the submit button
    var submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.innerText = 'Submit';
    questionnaire!.appendChild(submitButton);

    // form submission behavior
    questionnaire!.onsubmit = (event) => {
      event.preventDefault();

      let answers: { [key: string]: Number } = {};

      for (i = 0; i < QUESTIONS.length; ++i) {
        const Q = QUESTIONS[i];
        const N = Q.split(' ').join('_')
        let elements = document.getElementsByName(N);

        let found = false;
        for (let j = 0; j < 7; ++j) { // size will always be 7, look at radio buttons above
          const E = elements[j] as HTMLInputElement;
          if (E.checked) {
            answers[Q] = Number(E.value);
            found = true;
            break;
          }
        }

        document.getElementById(N)!.style.borderColor = found ? 'white' : 'red';
      }

      if (Object.keys(answers).length == QUESTIONS.length) {
        DB.submitSurvey(answers);
        console.log('Survey submitted');
        document.getElementById('survey')!.style.display = "none";
        document.getElementById('complete')!.style.display = "block";
      } else {
        document.getElementById('errorText')!.innerText = 'Please fill in the whole questionnaire. Red boxes indicate missed answers.';
      }
    };

    // hide game and make the survey visible
    document.getElementById('canvas')!.style.display = "none";
    document.getElementById('survey')!.style.display = "block";

    // Engine isn't needed anymore at this point in the game
    engine.shutoff();
  }

  // Never called functions
  public onExit(engine: Engine): void { }
  public update(engine: Engine): number { return -1; }
}
