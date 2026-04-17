export const nowIso = () => new Date().toISOString();

export const addMinutes = (isoDate, minutes) => {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

export const isExpired = (isoDate) => new Date(isoDate).getTime() < Date.now();
