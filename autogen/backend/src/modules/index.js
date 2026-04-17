import { authRouter } from "./auth/auth.routes.js";
import { profilesRouter } from "./profiles/profiles.routes.js";
import { marineWeatherRouter } from "./marine-weather/marine-weather.routes.js";
import { advisoriesRouter } from "./advisories/advisories.routes.js";
import { zonesRouter } from "./zones/zones.routes.js";
import { alertsRouter } from "./alerts/alerts.routes.js";
import { noticesRouter } from "./notices/notices.routes.js";
import { emergencySosRouter } from "./emergency-sos/emergency-sos.routes.js";

export const domainRouters = [
  { path: "/auth", router: authRouter },
  { path: "/profiles", router: profilesRouter },
  { path: "/marine", router: marineWeatherRouter },
  { path: "/advisories", router: advisoriesRouter },
  { path: "/zones", router: zonesRouter },
  { path: "/alerts", router: alertsRouter },
  { path: "/notices", router: noticesRouter },
  { path: "/emergency/sos", router: emergencySosRouter }
];

export const registerDomainModules = (app) => {
  for (const { path, router } of domainRouters) {
    app.use(path, router);
  }
};
