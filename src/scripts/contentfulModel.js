/*
  Contentful Model implements Model Functionality and works with the Contnentful headless CMS, where data is stored.
*/
import * as contentful from "contentful";
import { Model } from "./model";

class ContentfulModel extends Model {
  #contentfulClient;

  constructor() {
    super();

    const createClientFunc = contentful.createClient
      ? contentful.createClient
      : contentful.default.createClient;

    // Read API keys from .env file in project root folder on a Server Side (Remember to set up Netlify (hosting provider) env. variables)
    const contentfulSpaceID = import.meta.env.CONTENTFUL_SPACE_ID;
    const contentfulEnvironmentName = import.meta.env.CONTENTFUL_ENVIRONMENT;
    const contentfulAPIKey = import.meta.env.CONTENTFUL_DELIVERY_TOKEN;

    this.#contentfulClient = createClientFunc({
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
    const entries = await this.#contentfulClient.getEntries({
      content_type: "land",
    });

    // Transform JSON into land objects
    const lands = entries.items.map(this.#entryItemToLand.bind(this));

    // Update model state
    this.lands = lands;
    this.dataLoaded = true;
  }

  /* Get land address using API and reverse geocoding */
  async updateLandsAddresses(lands) {
    // Do not forget to set up API keys in Netlify environment
    const geoapifyAPIKey = import.meta.env.GEOAPIFY_KEY;
    const url = `https://api.geoapify.com/v1/batch?apiKey=${geoapifyAPIKey}`;

    // Form API Request Body as in the documentation https://www.geoapify.com/solutions/batch-geocoding-requests
    const requestInputs = lands
      .filter((land) => land.coords[0]) // Use only lands with specified coordinates
      .map((land) => {
        return {
          id: land.slug,
          params: { lat: land.coords[0], lon: land.coords[1] },
        };
      });

    let requestData = {
      api: "/v1/geocode/reverse",
      params: {
        lang: "vi",
      },
      inputs: requestInputs,
    };

    // Batch fetch requests (asyncronous fetching) to get address for each of the [lat, long] land coordinates inputs
    // Reference https://apidocs.geoapify.com/samples/batch/batch-call-javascript/

    function getBodyAndStatus(response) {
      return response.json().then((responceBody) => {
        return {
          status: response.status,
          body: responceBody,
        };
      });
    }

    function getAsyncResult(url, timeout, maxAttempt) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          repeatUntilSuccess(resolve, reject, 0);
        }, timeout);
      });

      function repeatUntilSuccess(resolve, reject, attempt) {
        console.log("Geoapify georeverce api attempt: " + attempt);
        fetch(url)
          .then(getBodyAndStatus)
          .then((result) => {
            if (result.status === 200) {
              resolve(result.body);
            } else if (attempt >= maxAttempt) {
              reject("Max amount of attempt achived");
            } else if (result.status === 202) {
              // Check again after timeout
              setTimeout(() => {
                repeatUntilSuccess(resolve, reject, attempt + 1);
              }, timeout);
            } else {
              // Something went wrong
              reject(result.body);
            }
          })
          .catch((err) => reject(err));
      }
    }

    let addresses = await fetch(url, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then(getBodyAndStatus)
      .then((result) => {
        if (result.status !== 202) {
          return Promise.reject(result);
        } else {
          return getAsyncResult(`${url}&id=${result.body.id}`, 1000, 100).then(
            (queryResult) => {
              // console.log(queryResult);
              return queryResult;
            }
          );
        }
      })
      .catch((err) => console.log(err));

    // After all addresses are fetched, add them into the existing lands data
    addresses?.results.forEach((addr) => {
      // Find land the address was fetched for
      let land = lands.find((land) => land.slug === addr.id);

      // And pass to it address value
      land.address = addr.result.features[0].properties.formatted.replace(
        ", Việt Nam",
        ""
      );
    });
  }

  // Parse land json (as fetched from contentful CMS) to a land object
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

export default new ContentfulModel();
