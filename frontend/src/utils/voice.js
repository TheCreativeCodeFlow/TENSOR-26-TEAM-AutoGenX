export function speak(text, language = "en-US") {
  if (!("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export const languageToVoice = {
  en: "en-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  te: "te-IN",
  or: "or-IN",
};
