/* Smooth scroll to specified sections of the page */
export default class ScrollView {
  #elementsToSnap = [];
  #topOffset = 0;

  #currentElementInFocuse = 0;
  #nextElementToFocuse;

  #isActive = true;
  #isRunningScrollAnimation = false;

  /* Accept array of elements with specified scroll options [{section: element, align: top (default)/ center, dynamic: false (default) / true}] */
  constructor(snapElements) {
    console.log("Scroll constructor recieved elements", snapElements);

    /* Calculate page offset to account for sticky header */
    this.#calcTopOffset();

    /* Calculate y snap points for each of the elements and store results in array */
    snapElements.forEach((el, index) => {
      // First snap point is always zero
      let snapPoint = 0;
      // For next elements calculate points depending on alignment preferences
      if (index > 0) {
        snapPoint =
          el?.align === "center"
            ? this.#calcElementCenter(el.pageElement)
            : this.#calcElementTop(el.pageElement);
      }

      this.#elementsToSnap.push({
        element: el.pageElement,
        snapPoint: snapPoint,
        dynamic: el.dynamic || false,
      });
    });

    console.log("Calculated snap points for elements: ", this.#elementsToSnap);

    /* Update initial state of scroller*/
    this.#calcCurrentElementInFocuse();
  }

  /* Turn scroll handling on and off */
  setActive(value) {
    this.#isActive = value;
  }

  /* Read page heading height, as defined in CSS var */
  #calcTopOffset() {
    // Get value in units defined in CSS (Rem)
    const stickyHeadingHeight = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--navbar-height");

    // Calculate value in pixels
    const offsetInPixels =
      parseFloat(stickyHeadingHeight) *
      parseFloat(getComputedStyle(document.documentElement).fontSize);

    this.#topOffset = offsetInPixels;

    // console.log(stickyHeadingHeight, offsetInPixels);
  }

  /* Calculate top coordinate of the element */
  #calcElementTop(element) {
    return (
      element.getBoundingClientRect().top + window.scrollY - this.#topOffset
    );
  }

  /* Calculate center coordinate of the element */
  // TODO- fix bug
  #calcElementCenter(element) {
    return (
      element.getBoundingClientRect().top +
      window.scrollY -
      this.#topOffset -
      (window.innerHeight - element.getBoundingClientRect().height / 2)
    );
  }

  /* Calculate currently focused element (in case of page reload) */
  #calcCurrentElementInFocuse() {
    let curentY = window.scrollY;
    for (let element = 0; element < this.#elementsToSnap.length; element++) {
      if (curentY >= this.#elementsToSnap[element].snapPoint) {
        this.#currentElementInFocuse = element;
      }
      //   console.log(
      //     "scrollY: ",
      //     curentY,
      //     "\t snapY: ",
      //     this.#elementsToSnap[element].snapPoint
      //   );
    }

    // Special check if footer is focused (it does not take full window height like other sections)
    let footerNumber = this.#elementsToSnap.length - 1;
    if (
      curentY + window.innerHeight - this.#topOffset * 2 >
      this.#elementsToSnap[footerNumber].snapPoint
    )
      this.#currentElementInFocuse = footerNumber;

    console.log(
      "Initially focused on ",
      this.#elementsToSnap[this.#currentElementInFocuse].element
    );
  }

  /*  Handle smooth scroll animations */
  #wait(miliseconds) {
    return new Promise((_) => setTimeout(_, miliseconds));
  }

  /* Smooothly scroll page between snap points*/
  async handleScroll(e) {
    if (!this.#isActive) return;

    // Prevent default behaviour on mouse wheel event
    e.stopPropagation();
    e.preventDefault();

    // Wait until previous animation finishes
    if (this.#isRunningScrollAnimation) return;

    // Calculate next section to go to
    this.#nextElementToFocuse =
      e.deltaY > 0
        ? this.#currentElementInFocuse + 1 // Go down
        : this.#currentElementInFocuse - 1; // Go up

    if (
      this.#nextElementToFocuse < 0 ||
      this.#nextElementToFocuse >= this.#elementsToSnap.length
    )
      return; // Already on the first/last section of the page

    // Scroll to next section
    this.#isRunningScrollAnimation = true;
    console.log(
      "Current section: ",
      this.#elementsToSnap[this.#currentElementInFocuse]
    );
    this.#currentElementInFocuse = this.#nextElementToFocuse;
    window.scroll({
      top: this.#elementsToSnap[this.#currentElementInFocuse].snapPoint,
      behavior: "smooth",
    });

    console.log(
      "Scroll to: ",
      this.#elementsToSnap[this.#currentElementInFocuse]
    );

    // Release block of scroll animation when scrolling is finished
    await this.#wait(
      Math.abs(
        this.#elementsToSnap[this.#currentElementInFocuse].snapPoint -
          window.scrollY
      ) * 0.5 // Timeout is proportional to scroll length
    );
    this.#isRunningScrollAnimation = false;
  }
}
