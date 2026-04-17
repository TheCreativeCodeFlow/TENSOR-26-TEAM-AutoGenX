import { createValidationError } from "../shared/errors.js";
import { liveDataProvider } from "../shared/live-data.provider.js";

export const noticesService = {
  async list(status) {
    const notices = await liveDataProvider.getIncoisBulletins();
    const normalized = notices.map((notice) => ({
      id: notice.id,
      zoneId: "all-zones",
      priority: "high",
      text: notice.title,
      source: notice.source,
      link: notice.link,
      status: status || "active",
      createdAt: new Date().toISOString(),
      expiresAt: null,
    }));
    return { notices: normalized };
  },
  create(payload) {
    throw createValidationError("Manual notice creation is disabled in strict live-data mode.", {
      source: "INCOIS bulletins",
      requestedPayload: payload,
    });
  },
  expire(noticeId) {
    throw createValidationError("Manual notice expiry is disabled in strict live-data mode.", { noticeId });
  }
};
