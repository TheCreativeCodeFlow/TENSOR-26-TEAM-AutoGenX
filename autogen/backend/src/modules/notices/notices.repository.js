import { notices } from "../../data/mock/notices.data.js";
import { generateId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export const noticesRepository = {
  list(status = "active") {
    return notices.filter((notice) => (status ? notice.status === status : true));
  },
  create(payload) {
    const item = {
      id: generateId("notice"),
      ...payload,
      status: "active",
      createdAt: nowIso()
    };
    notices.unshift(item);
    return item;
  },
  expire(noticeId) {
    const notice = notices.find((row) => row.id === noticeId);
    if (!notice) return null;
    notice.status = "expired";
    notice.expiresAt = nowIso();
    return notice;
  }
};
