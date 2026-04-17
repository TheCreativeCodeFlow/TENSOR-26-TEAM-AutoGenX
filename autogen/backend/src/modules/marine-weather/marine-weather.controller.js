import { controller, ok } from "../shared/http.js";
import { marineWeatherService } from "./marine-weather.service.js";
import { validateForecastQuery, validateMarineQuery } from "./marine-weather.validator.js";

export const getCurrentConditions = controller(async (req, res) => {
  const { zoneId } = validateMarineQuery(req.query || {});
  return ok(res, await marineWeatherService.getCurrent(zoneId));
});

export const getForecast = controller(async (req, res) => {
  const { zoneId, hours } = validateForecastQuery(req.query || {});
  return ok(res, await marineWeatherService.getForecast(zoneId, hours));
});

export const getTides = controller(async (req, res) => {
  const { zoneId } = validateMarineQuery(req.query || {});
  return ok(res, await marineWeatherService.getTides(zoneId));
});
