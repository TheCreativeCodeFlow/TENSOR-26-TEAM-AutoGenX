import { useState } from "react";

const localeByLanguage = {
  en: "en-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  te: "te-IN",
  or: "or-IN",
};

const VoiceReadoutButton = ({ text, language = "en", className = "" }) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    const utteranceText = String(text || "").trim();
    if (!utteranceText || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.lang = localeByLanguage[language] || "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`voice-btn ${speaking ? "voice-btn-speaking" : ""} ${className}`}
      aria-label="Read alert with voice"
    >
      <span className="material-symbols-outlined">{speaking ? "equalizer" : "volume_up"}</span>
      <span>{speaking ? "Reading..." : "Voice Readout"}</span>
    </button>
  );
};

export default VoiceReadoutButton;
