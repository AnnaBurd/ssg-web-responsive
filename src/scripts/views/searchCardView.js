import Splide from "@splidejs/splide";
import "@splidejs/splide/css";

export default class SearchCardView {
  #parent;
  #data;

  #mainSplideEl;
  #thumbnailSplideEl;

  #mainSplide;
  #thumbnailSplide;

  static #mainSplideOptions = {
    type: "slide",
    //arrowPath: 'm15.5 0.932-4.3 4.38 14.5 14.6-14.5 14.5 4.3 4.4 14.6-14.6 4.4-4.3-4.4-4.4-14.6-14.6z', // Arrow ">" path from the svg file, svg must be 40x40
    arrowPath:
      "M25.0132 20.0001L9.84961 35.0808C8.71683 36.2062 8.71683 38.0308 9.84961 39.156C10.9822 40.2813 12.8189 40.2813 13.9518 39.156L31.0186 22.1824C31.6223 21.5828 31.8939 20.7852 31.8542 20.0001C31.8939 19.2149 31.6223 18.4173 31.0186 17.8176L13.9518 0.844067C12.8189 -0.281354 10.9825 -0.281354 9.84961 0.844067C8.71676 1.96949 8.71683 3.79398 9.84961 4.91911L25.0132 20.0001Z",
    rewind: false, // Do not jump from end to start
    perPage: 1, // Number of the images per slide
    autoplay: false,
    arrows: true,
    pagination: false, // No dots with progress
    drag: true,
    keyboard: true,
    lazyLoad: "nearby", // Load next images only when user scrolls slider
  };

  static #thumbnailSplideOptions = {
    direction: "ttb", // Direction of sliding from top-to-bottom
    width: "100%", // Slider line takes full width of its container (shrinks adaptively for device size)
    height: "100%", // Slider line takes full height of its container (shrinks adaptively for device size)
    perPage: 5, // Number of the thumbnail images
    rewind: false,
    pagination: false,
    focus: "top", // Must be 'top' so if there is not enough thumbnail images for full height of the vertical thumbnail images are alligned on top
    isNavigation: true, // Makes thumbnails clickable
    arrows: false,
    updateOnMove: true, //Updates the is-active status class just before moving the carousel for nicer transition
  };

  constructor(data, containerElement) {
    this.#parent = containerElement;
    this.#data = data;
  }

  #generateHTML() {
    let html = `<div class="land-card">
        <div class="land-card__gallery">
            ${this.#generateCarouselHTML(
              this.#data.images,
              this.#data.videos,
              this.#data.title
            )}
        </div>
        <a href="/${this.#data.slug}" class="land-card__link"
          ><div class="land-card__info">
            <h4 class="land-card__title nice-h4">${this.#data.title}</h4>
            <div class="land-card__description nice-p4">${
              this.#data.briefDescription
            }</div>
            <div class="land-props">
                ${this.#generateLandPropertiesHTML()}
            </div>
          </div>
          <div class="land-card__tag price-tag">
            <span class="land-card__area price-tag__area">${this.#data.area
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} m&sup2</span
            ><span class="land-card__price price-tag__price">${this.#data.price.toFixed(
              1
            )}&nbsp;</span
            ><span class="price-tag__price-units"> tỷ</span>
          </div>
          <button class="land-card__btn nice-btn nice-btn--transparent nice-btn--icon">
            <svg class="nice-btn__icon">
              <use xlink:href="/icons.svg#share"></use>
            </svg>
          </button>
        </a>
      </div>`;

    return html;
  }

  #generateLandPropertiesHTML() {
    return `
    ${
      this.#data.address
        ? `<div class="land-prop land-prop--address">
                <span class="land-prop__icon">
                  <svg>
                    <use xlink:href="/icons.svg#icon-location-2"></use>
                  </svg>
                </span>
                <span class="land-prop__text">Địa chỉ: ${this.#data.address}
                </span>
            </div>`
        : ""
    }

    <div class="land-prop">
        <span class="land-prop__icon">
            <svg>
                <use xlink:href="/icons.svg#icon-area"></use>
            </svg>
        </span>
        <span class="land-prop__text">Điện tích: ${this.#data.area
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}&nbsp;m&sup2
        </span>
    </div>

    ${
      this.#data.faceSideLength > 0
        ? `<div class="land-prop">
                <span class="land-prop__icon">
                    <svg>
                        <use xlink:href="/icons.svg#icon-faceside"></use>
                    </svg>
                </span>
                <span class="land-prop__text"> Mặt tiền: ${
                  this.#data.faceSideLength
                }&nbsp;m
                </span>
            </div>`
        : ""
    }

    ${
      this.#data.papers
        ? `<div class="land-prop">
                <span class="land-prop__icon">
                    <svg>
                        <use xlink:href="/icons.svg#icon-papers-3"></use>
                    </svg>
                </span>
                <span class="land-prop__text"> Giấy tờ pháp lý: ${
                  this.#data.papers
                }
                </span>
            </div>`
        : ""
    }



    <div class="land-prop">
        <span class="land-prop__icon">
            <svg>
                <use xlink:href="/icons.svg#icon-price"></use>
            </svg>
        </span>
        <span class="land-prop__text"> Giá: ${this.#data.price}&nbsp;tỷ (${(
      (this.#data.price * 1000) /
      this.#data.area
    ).toFixed(1)}&nbsp;triều/m&sup2)</span>
    </div>
`;
  }

  // TODO adjust images sizes
  #generateCarouselHTML() {
    const generatePhotoTrack = (photos) => {
      return photos
        .map(
          (photo) => `<li class="splide__slide">
                        <img data-splide-lazy="${photo}" alt="Photo slide" />
                    </li>`
        )
        .join("");
    };

    const generateThumbnailsTrack = (thumbnails) => {
      return thumbnails
        .map(
          (thumbnail) => `<li class="splide__slide">
                            <img src="${thumbnail}" alt="Thumbnail photo" />
                        </li>`
        )
        .join("");
    };

    return `
    <div
        id="main-carousel-${this.#data.slug}"
        class="splide main-splide"
        aria-label="${this.#data.title} land photos"
        >
        <div class="splide__track">
            <ul class="splide__list">
                ${generatePhotoTrack(this.#data.images)}
            </ul>
        </div>
    </div>
    
    <div
        id="thumbnail-carousel-${this.#data.slug}"
        class="splide thumbnail-splide"
        aria-label="Thumbnail button"
        >
        <div class="splide__track">
            <ul class="splide__list">
                ${generateThumbnailsTrack(this.#data.images)}
            </ul>
        </div>
    </div>`;
  }

  #initCarousels(landSlug) {
    this.#mainSplideEl = document.getElementById(`main-carousel-${landSlug}`);
    this.#thumbnailSplideEl = document.getElementById(
      `thumbnail-carousel-${landSlug}`
    );

    this.#mainSplide = new Splide(
      this.#mainSplideEl,
      SearchCardView.#mainSplideOptions
    );

    this.#thumbnailSplide = new Splide(
      this.#thumbnailSplideEl,
      SearchCardView.#thumbnailSplideOptions
    );

    this.#mainSplide.sync(this.#thumbnailSplide);
    this.#mainSplide.mount();
    this.#thumbnailSplide.mount();
  }

  render() {
    // Generate html markup
    let html = this.#generateHTML();

    // Insert card html into the page
    this.#parent.insertAdjacentHTML("beforeend", html);

    // Init carousel
    this.#initCarousels(this.#data.slug);
  }
}
