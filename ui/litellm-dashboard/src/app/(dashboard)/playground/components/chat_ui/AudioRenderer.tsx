import React from "react";
import i18n from "@/lib/i18n";
import { MessageType } from "@/components/chat_ui/types";

interface AudioRendererProps {
  message: MessageType;
}

const AudioRenderer: React.FC<AudioRendererProps> = ({ message }) => {
  // Check if this message contains audio
  if (!message.isAudio || typeof message.content !== "string") {
    return null;
  }

  return (
    <div className="mb-2">
      <audio controls src={message.content} className="max-w-full" style={{ maxWidth: "500px" }}>
        {i18n.t("audioRenderer.your-browser-does-not-support-the-audio-elem", { defaultValue: "Your browser does not support the audio element." })}</audio>
    </div>
  );
};

export default AudioRenderer;
