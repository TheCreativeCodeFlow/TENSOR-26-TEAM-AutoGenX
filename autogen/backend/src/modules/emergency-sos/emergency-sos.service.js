import { profilesRepository } from "../profiles/profiles.repository.js";
import { env } from "../../config/env.js";
import { createNotFoundError } from "../shared/errors.js";
import { emergencySosRepository } from "./emergency-sos.repository.js";

const escalationContacts = [
  { agency: "Indian Coast Guard", channel: "Emergency Hotline", priority: 1, contact: env.coastGuardNumber },
  { agency: "District Marine Control Room", channel: "Hotline", priority: 2 },
  { agency: "Village Harbor Patrol", channel: "SMS", priority: 3 }
];

export const emergencySosService = {
  async raise(userId, payload) {
    const profile = await profilesRepository.findByUserId(userId);
    const dispatchedAt = new Date().toISOString();
    const event = await emergencySosRepository.create({
      userId,
      fisherName: profile?.fullName || "Unknown",
      vesselId: profile?.vesselId || "Unknown",
      safetyPhone: profile?.phone || profile?.safetyPhone || null,
      locationLabel: profile?.locationLabel || null,
      coastGuardNumber: env.coastGuardNumber,
      ...payload,
      escalationPlan: escalationContacts,
      dispatch: {
        dispatchedAt,
        channel: "voice-call",
        target: env.coastGuardNumber,
        status: "queued",
        note: "Client app should immediately open tel:1554 while backend logs this SOS event.",
      },
    });
    return { sos: event };
  },
  async list(userId, status) {
    return { sosEvents: await emergencySosRepository.list({ userId, status }) };
  },
  async updateStatus(eventId, status) {
    const event = await emergencySosRepository.updateStatus(eventId, status);
    if (!event) throw createNotFoundError("SOS event", eventId);
    return { sos: event };
  }
};
