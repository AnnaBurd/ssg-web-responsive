const PAUSE_BETWEEN_LINE_ANIMATIONS_SECONDS = 1;
const PAUSE_BETWEEN_CHARACTER_ANIMATIONS_SECONDS = 0.1;
const SPEED_INCREASE_WHEN_ERASING_TIMES = 3;

export default class RunningTextLineView {
  #data;
  #parentElement;

  #currLine = 0;
  #running = false;

  #pauseBetweenLineAnimations = PAUSE_BETWEEN_LINE_ANIMATIONS_SECONDS;
  #pauseBetweenCharacterAnimations = PAUSE_BETWEEN_CHARACTER_ANIMATIONS_SECONDS;
  #speedUp = SPEED_INCREASE_WHEN_ERASING_TIMES;

  constructor(lineElement, textlines) {
    this.#parentElement = lineElement;
    this.#data = textlines;
  }

  async #sleep(sec) {
    return new Promise((_) => setTimeout(_, sec * 1000));
  }

  async #eraseLine() {
    let prevText = this.#data[this.#currLine];

    for (let i = prevText.length; i >= 0; i--) {
      this.#parentElement.innerHTML = prevText.slice(0, i) + "︳";
      await this.#sleep(this.#pauseBetweenCharacterAnimations / this.#speedUp);
    }
  }

  async #printLine() {
    if (++this.#currLine >= this.#data.length) {
      this.#currLine = 0;
    }
    let newText = this.#data[this.#currLine];

    for (let i = 0; i <= newText.length; i++) {
      this.#parentElement.innerHTML = newText.slice(0, i) + "︳";
      await this.#sleep(this.#pauseBetweenCharacterAnimations);
    }
  }

  async startAnimation() {
    this.#running = true;

    while (this.#running) {
      await this.#eraseLine();
      await this.#sleep(this.#pauseBetweenLineAnimations / this.#speedUp);
      await this.#printLine();
      await this.#sleep(this.#pauseBetweenLineAnimations);
    }
  }

  async stopAnimation() {
    this.#running = false;
  }

  setData(textlines) {
    this.#data = textlines;
  }
}
