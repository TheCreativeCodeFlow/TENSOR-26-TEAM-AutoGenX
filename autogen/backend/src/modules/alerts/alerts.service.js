import { createValidationError } from "../shared/errors.js";
import { liveDataProvider } from "../shared/live-data.provider.js";

export const alertsService = {
  async list(query) {
    const items = await liveDataProvider.getImdCapAlerts();
    const level = query?.level ? String(query.level).toUpperCase() : null;
    const zoneId = query?.zoneId ? String(query.zoneId) : null;

    const alerts = items
      .map((item) => ({
        id: item.id,
        zoneId: zoneId || "all-zones",
        level: level || "ADVISORY",
        severity: level === "DANGER" || level === "CYCLONE_WARNING" ? "critical" : "medium",
        title: item.title,
        link: item.link,
        message: {
          en: item.description || item.title,
          ta: item.description || item.title,
          ml: item.description || item.title,
          te: item.description || item.title,
          or: item.description || item.title,
        },
        createdAt: item.publishedAt,
      }))
      .slice(0, 20);

    return { alerts };
  },
  create(payload) {
    throw createValidationError("Manual alert creation is disabled in strict live-data mode.", {
      source: "IMD CAP RSS",
      requestedPayload: payload,
    });
  }
};
