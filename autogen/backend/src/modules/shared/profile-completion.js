const PROFILE_REQUIRED_FIELDS = ["fullName", "age", "coastalArea", "locationLabel", "language", "boatType", "phone", "latitude", "longitude"];

export const getProfileCompletion = (profile) => {
  if (!profile) {
    return {
      hasProfile: false,
      isComplete: false,
      missingFields: [...PROFILE_REQUIRED_FIELDS],
      requiredFields: [...PROFILE_REQUIRED_FIELDS],
    };
  }

  const missingFields = PROFILE_REQUIRED_FIELDS.filter((field) => {
    const value = profile[field];
    return value === undefined || value === null || value === "";
  });

  return {
    hasProfile: true,
    isComplete: missingFields.length === 0,
    missingFields,
    requiredFields: [...PROFILE_REQUIRED_FIELDS],
  };
};

export const requiredProfileFields = Object.freeze([...PROFILE_REQUIRED_FIELDS]);