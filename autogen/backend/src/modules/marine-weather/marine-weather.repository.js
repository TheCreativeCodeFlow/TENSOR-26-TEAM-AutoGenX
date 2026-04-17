import { marineSnapshots } from "../../data/mock/marine.data.js";

export const marineWeatherRepository = {
  saveSnapshot(zoneId, data) {
    marineSnapshots.set(zoneId, data);
  },
  getSnapshot(zoneId) {
    return marineSnapshots.get(zoneId) || null;
  }
};
