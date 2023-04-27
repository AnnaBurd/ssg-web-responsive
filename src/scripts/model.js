/*
  Manage application data and provides data to both statically generated page components and dynamically generated components on Client side.
*/
export class Model {
  dataLoaded = false;
  lands = []; // Lands data

  async getAllLandsData() {
    if (!this.dataLoaded) await this.loadAllLandsData();
    return this.lands;
  }

  async getPromotedLandsData() {
    if (!this.dataLoaded) await this.loadAllLandsData();
    return this.lands.filter((land) => land.promoted);
  }

  getLandData(slug) {
    return this.lands.find((land) => land.slug === slug);
  }

  getSuggestedLandsData(land) {
    if (!land.suggestedLands) return [];

    return land.suggestedLands.map((slug) =>
      this.lands.find((land) => land.slug === slug)
    );
  }

  getLandMaxPrice() {
    return this.lands.reduce((max, next) => {
      return next.price > max ? next.price : max;
    }, 0);
  }

  getLandMaxArea() {
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
  async searchLands(priceRange, areaRange, sortBy = "default") {
    if (!this.dataLoaded) await this.loadAllLandsData();

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

  /* Convert land title into url slug, accepts vietnamese characters */
  static titleToSlug(title) {
    return title
      .toLowerCase()
      .replace(
        /[^a-z0-9_,àáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽềềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ ]/gu,
        ""
      )
      .replaceAll(" ", "-");
  }
}
