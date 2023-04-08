/*
  Contentful Model implements Model Functionality and works with the Contnentful headless CMS, where data is stored.
*/
import * as contentful from "contentful";
import { Model } from "./model";

class ClientModel extends Model {
  #client;
  lands = [];
  dataLoaded = false;

  constructor() {
    super();

    const createClientFunc = contentful.createClient
      ? contentful.createClient
      : contentful.default.createClient;

    // Read API keys from .env file in project root folder on a Server Side (Remember to set up Netlify (hosting provider) env. variables)
    const contentfulSpaceID = import.meta.env.CONTENTFUL_SPACE_ID;
    const contentfulEnvironmentName = import.meta.env.CONTENTFUL_ENVIRONMENT;
    const contentfulAPIKey = import.meta.env.CONTENTFUL_DELIVERY_TOKEN;

    // Or read API keys from tocken passed to client //
    // TODO     // TODO hide API keys (options - cookie / embed in html (simplest and ok for this case) / Use astro's inline js <script define:vars={{init}}>)

    this.#client = createClientFunc({
      space: contentfulSpaceID,
      environment: contentfulEnvironmentName,
      accessToken: contentfulAPIKey,
    });
  }

  async loadAllLandsData() {
    // Clear previous data
    this.lands = [];
    this.dataLoaded = false;

    // Fetch data from cms
    const entries = await this.#client.getEntries({
      content_type: "land",
    });

    // Apply data transformations
    const lands = entries.items.map(this.#entryItemToLand.bind(this));

    // Update model state
    this.lands = lands;
    this.dataLoaded = true;
  }

  // Parse entry fetched from CMS to a land object
  #entryItemToLand(item) {
    const longDescriptionOfLand = item.fields.longDescription?.content.flatMap(
      (descrNode) => {
        if (descrNode.nodeType === "paragraph" && descrNode.content[0].value) {
          return { paragraph: descrNode.content[0].value };
        }

        if (descrNode.nodeType === "unordered-list") {
          return {
            bulletPoints: descrNode.content.map(
              (li) => li.content[0].content[0].value
            ),
          };
        }

        return [];
      }
    );

    const land = {
      title: item.fields.title,
      slug: Model.titleToSlug(item.fields.title),
      promoted: item.fields.promoted,
      briefDescription: item.fields.briefDescription,
      longDescription: longDescriptionOfLand,
      address: "todo", //TODO
      coords: [item.fields.location?.lat, item.fields.location?.lon],
      coordsPolygon: [], // TODO?
      area: item.fields.area,
      faceSideLength: item.fields.faceSideLength,
      papers: item.fields.papers,
      price: item.fields.price / 1000000000.0,
      link: item.fields.link,
      images: item.fields.images?.map((img) => img.fields.file.url) || [],
      videos: item.fields.videos, // TODO
      suggestedLands: item.fields?.suggestedLands?.map((suggestedLandItem) =>
        Model.titleToSlug(suggestedLandItem.fields?.title)
      ),
    };

    return land;
  }
}

export default new ClientModel();
