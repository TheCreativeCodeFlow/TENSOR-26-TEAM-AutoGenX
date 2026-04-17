import { useState } from "react";
import { speak } from "../utils/voice.js";

const labelByLanguage = {
  en: { idle: "Voice Readout", reading: "Reading..." },
  ta: { idle: "ஒலி வாசிப்பு", reading: "வாசிக்கிறது..." },
  ml: { idle: "ശബ്ദ വായനം", reading: "വായിക്കുന്നു..." },
  te: { idle: "వాయిస్ రీడౌట్", reading: "చదువుతోంది..." },
  or: { idle: "ଶବ୍ଦ ପଠନ", reading: "ପଢୁଛି..." },
};

const VoiceReadoutButton = ({ text, language = "en", className = "" }) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    const utteranceText = String(text || "").trim();
    if (!utteranceText) return;

    await speak(utteranceText, language, {
      rate: 0.95,
      pitch: 1,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`voice-btn ${speaking ? "voice-btn-speaking" : ""} ${className}`}
      aria-label={(labelByLanguage[language] || labelByLanguage.en).idle}
    >
      <span className="material-symbols-outlined">{speaking ? "equalizer" : "volume_up"}</span>
      <span>{speaking ? (labelByLanguage[language] || labelByLanguage.en).reading : (labelByLanguage[language] || labelByLanguage.en).idle}</span>
    </button>
  );
};

export default VoiceReadoutButton;
