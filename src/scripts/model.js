/*
  Manage application data and provides data to both statically generated page components and dynamically generated components on Client side.

  As of now data does not flow between different pages, but on client side some pages fetch the same data (e.g. map and search), TODO is to consider sharing local storage between pages (e.g. nanostorage?) 
*/
export class Model {
  static titleToSlug(title) {
    return title
      .toLowerCase()
      .replace(
        /[^a-z0-9_,àáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ ]/gu,
        ""
      )
      .replaceAll(" ", "-");
  }

  lands;
  dataLoaded;

  constructor() {
    console.log("Constructor of abstract model");
  }

  async loadAllLandsData() {
    console.log("Call of loadAllLandsData() of abstract model");
  }

  async getAllLandsData() {
    if (!this.dataLoaded) await this.loadAllLandsData();
    return this.lands;
  }

  async getPromotedLandsData() {
    if (!this.dataLoaded) await this.loadAllLandsData();
    return this.lands.filter((land) => land.promoted);
  }

  // Slugs are unique for each land and can be used as identifiers
  async getLandData(slug) {
    if (!this.dataLoaded) await this.loadAllLandsData();
    return this.lands.find((land) => land.slug === slug);
  }

  getSuggestedLandsData(land) {
    if (!land.suggestedLands) {
      return [];
    }

    const suggestedLands = land.suggestedLands.map((slug) =>
      this.lands.find((land) => land.slug === slug)
    );

    return suggestedLands;
  }

  getMaxLandPrice() {
    return this.lands.reduce((max, next) => {
      return next.price > max ? next.price : max;
    }, 0);
  }

  getMaxLandArea() {
    return this.lands.reduce((max, next) => {
      return next.area > max ? next.area : max;
    }, 0);
  }

  // There are only a few land items, so all of data is preloaded in a single request.
  // In case of larger numbers of land items, specific items can be fetched as below:
  // const entries = await client.getEntries({
  //   content_type: "land",
  //   "fields.price[gte]": priceMin,
  //   select:
  //     "fields.title, fields.briefDescription, fields.price, fields.location, fields.images",
  // });
  // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters/ranges/query-entries/console/js
  async searchLands(priceRange, areaRange, sortBy) {
    let [priceMin, priceMax] = priceRange;
    let [areaMin, areaMax] = areaRange;

    let searchResults = this.lands
      .filter((land) => land.price >= priceMin && land.price <= priceMax)
      .filter((land) => land.area >= areaMin && land.area <= areaMax)
      .sort((land1, land2) => {
        if (sortBy === "default") return 0; // Keep order
        if (sortBy === "priceUp") return land1.price - land2.price;
        if (sortBy === "priceDown") return land2.price - land1.price;
        if (sortBy === "areaUp") return land1.area - land2.area;
        if (sortBy === "areaDown") return land2.area - land1.area;
      });
    return searchResults;
  }
}
