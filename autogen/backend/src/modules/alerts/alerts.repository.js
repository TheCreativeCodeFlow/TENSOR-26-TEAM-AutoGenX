import { alerts } from "../../data/mock/alerts.data.js";
import { generateId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export const alertsRepository = {
  list({ severity, zoneId }) {
    return alerts.filter((alert) => {
      if (severity && alert.severity !== severity) return false;
      if (zoneId && alert.zoneId !== zoneId) return false;
      return true;
    });
  },
  create(payload) {
    const alert = {
      id: generateId("alert"),
      ...payload,
      createdAt: nowIso()
    };
    alerts.unshift(alert);
    return alert;
  }
};
