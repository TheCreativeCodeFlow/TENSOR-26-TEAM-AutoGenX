import { advisories } from "../../data/mock/advisories.data.js";
import { generateId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export const advisoriesRepository = {
  save(advisory) {
    const row = {
      id: generateId("adv"),
      ...advisory,
      createdAt: nowIso()
    };
    advisories.unshift(row);
    return row;
  },
  listByZone(zoneId, limit = 20) {
    return advisories.filter((a) => a.zoneId === zoneId).slice(0, limit);
  }
};
