import { Router } from "express";
import { getCurrentConditions, getForecast, getTides } from "./marine-weather.controller.js";

export const marineWeatherRouter = Router();

marineWeatherRouter.get("/conditions", getCurrentConditions);
marineWeatherRouter.get("/forecast", getForecast);
marineWeatherRouter.get("/tides", getTides);
