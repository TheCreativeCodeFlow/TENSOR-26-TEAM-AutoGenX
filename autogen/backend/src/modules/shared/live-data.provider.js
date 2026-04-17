import { env } from "../../config/env.js";
import { createValidationError } from "./errors.js";

const requireOpenWeatherConfig = () => {
  if (!env.openWeatherApiKey) {
    throw createValidationError("OPENWEATHER_API_KEY is required when STRICT_LIVE_DATA is enabled.");
  }
};

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw createValidationError(`Failed to fetch live data from ${url}`, { status: response.status });
  }
  return response.text();
};

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const parseRssItems = (xml) => {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return itemBlocks.slice(0, 30).map((block, index) => {
    const title = normalizeWhitespace((block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]);
    const link = normalizeWhitespace((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1]);
    const description = normalizeWhitespace((block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1]);
    const pubDate = normalizeWhitespace((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1]);

    return {
      id: `imd-cap-${index + 1}`,
      title: title || "IMD Alert",
      link,
      description,
      publishedAt: pubDate || null,
    };
  });
};

const extractIncoisHeadline = (html, fallbackTitle) => {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const headingMatch = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  const text = normalizeWhitespace((headingMatch && headingMatch[1]) || (titleMatch && titleMatch[1]) || fallbackTitle);
  return text || fallbackTitle;
};

export const liveDataProvider = {
  async getOpenWeatherCurrent(lat, lng) {
    requireOpenWeatherConfig();
    const url = `${env.openWeatherBaseUrl.replace(/\/$/, "")}/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&appid=${encodeURIComponent(env.openWeatherApiKey)}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
      throw createValidationError("OpenWeather current conditions request failed", { status: response.status });
    }
    return response.json();
  },

  async getOpenWeatherForecast(lat, lng) {
    requireOpenWeatherConfig();
    const url = `${env.openWeatherBaseUrl.replace(/\/$/, "")}/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&appid=${encodeURIComponent(env.openWeatherApiKey)}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
      throw createValidationError("OpenWeather forecast request failed", { status: response.status });
    }
    return response.json();
  },

  async getImdCapAlerts() {
    const xml = await fetchText(env.imdCapRssUrl);
    return parseRssItems(xml);
  },

  async getIncoisBulletins() {
    const [highWaveHtml, stormHtml] = await Promise.all([
      fetchText(env.incoisHighWaveUrl),
      fetchText(env.incoisStormSurgeUrl),
    ]);

    return [
      {
        id: "incois-hwa",
        title: extractIncoisHeadline(highWaveHtml, "INCOIS High Wave Bulletin"),
        link: env.incoisHighWaveUrl,
        source: "INCOIS",
      },
      {
        id: "incois-storm",
        title: extractIncoisHeadline(stormHtml, "INCOIS Storm Surge Bulletin"),
        link: env.incoisStormSurgeUrl,
        source: "INCOIS",
      },
    ];
  },
};
