import { createNotFoundError } from "../shared/errors.js";
import { profilesRepository } from "./profiles.repository.js";

export const profilesService = {
  async getByUserId(userId) {
    const profile = await profilesRepository.findByUserId(userId);
    if (!profile) throw createNotFoundError("Profile", userId);
    return { profile };
  },
  async upsertByUserId(userId, payload) {
    const profile = await profilesRepository.upsertByUserId(userId, payload);
    return { profile };
  }
};
