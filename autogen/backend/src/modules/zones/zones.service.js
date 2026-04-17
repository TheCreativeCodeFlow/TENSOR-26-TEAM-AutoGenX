import { createNotFoundError } from "../shared/errors.js";
import { zonesRepository } from "./zones.repository.js";

const containsPoint = (polygon, lat, lng) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersects =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersects) inside = !inside;
  }

  return inside;
};

export const zonesService = {
  async list() {
    return { zones: await zonesRepository.list() };
  },
  async get(zoneId) {
    const zone = await zonesRepository.findById(zoneId);
    if (!zone) throw createNotFoundError("Zone", zoneId);
    return { zone };
  },
  async locate(lat, lng) {
    const zones = await zonesRepository.list();
    const zone = zones.find((item) => containsPoint(item.polygon, lat, lng));
    if (!zone) throw createNotFoundError("Zone", `${lat},${lng}`);
    return { zone };
  }
};
