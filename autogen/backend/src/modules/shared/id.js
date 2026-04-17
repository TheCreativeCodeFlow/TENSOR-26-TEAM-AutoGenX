export const generateId = (prefix) => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
};

export const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;
