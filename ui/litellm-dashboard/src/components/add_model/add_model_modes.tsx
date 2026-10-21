import i18n from "@/lib/i18n";

// Define the available test modes
export const TEST_MODES = [
  { value: "chat", label: i18n.t("addModel.addModelModes.chatLabel", { defaultValue: "Chat - /chat/completions" }) },
  { value: "completion", label: i18n.t("addModel.addModelModes.completionLabel", { defaultValue: "Completion - /completions" }) },
  { value: "embedding", label: i18n.t("addModel.addModelModes.embeddingLabel", { defaultValue: "Embedding - /embeddings" }) },
  { value: "audio_speech", label: i18n.t("addModel.addModelModes.audioSpeechLabel", { defaultValue: "Audio Speech - /audio/speech" }) },
  { value: "audio_transcription", label: i18n.t("addModel.addModelModes.audioTranscriptionLabel", { defaultValue: "Audio Transcription - /audio/transcriptions" }) },
  { value: "image_generation", label: i18n.t("addModel.addModelModes.imageGenerationLabel", { defaultValue: "Image Generation - /images/generations" }) },
  { value: "image_edit", label: i18n.t("modelsEndpoints.addmodelmodes.imageEditImagesEdits", { defaultValue: "Image Edit - /images/edits" }) },
  { value: "video_generation", label: i18n.t("addModel.addModelModes.videoGenerationLabel", { defaultValue: "Video Generation - /videos" }) },
  { value: "rerank", label: i18n.t("addModel.addModelModes.rerankLabel", { defaultValue: "Rerank - /rerank" }) },
  { value: "realtime", label: i18n.t("addModel.addModelModes.realtimeLabel", { defaultValue: "Realtime - /realtime" }) },
  { value: "batch", label: i18n.t("addModel.addModelModes.batchLabel", { defaultValue: "Batch - /batch" }) },
  { value: "anthropic_messages", label: "Anthropic Messages - /v1/messages" },
  { value: "ocr", label: i18n.t("addModel.addModelModes.ocrLabel", { defaultValue: "OCR - /ocr" }) },
  { value: "evaluation", label: "Evaluation - /v1/decisions" },
];

// Define the available auto router routing strategies
export const AUTO_ROUTER_MODES = [
  { value: "simple-shuffle", label: i18n.t("addModel.addModelModes.simpleShuffleLabel", { defaultValue: "Simple Shuffle - Random selection from available models" }) },
  { value: "least-busy", label: i18n.t("addModel.addModelModes.leastBusyLabel", { defaultValue: "Least Busy - Route to model with lowest current load" }) },
  { value: "latency-based", label: i18n.t("addModel.addModelModes.latencyBasedLabel", { defaultValue: "Latency Based - Route to model with best response time" }) },
  { value: "cost-based", label: i18n.t("addModel.addModelModes.costBasedLabel", { defaultValue: "Cost Based - Route to most cost-effective model" }) },
  { value: "usage-based", label: i18n.t("addModel.addModelModes.usageBasedLabel", { defaultValue: "Usage Based - Route based on historical usage patterns" }) },
  { value: "custom", label: i18n.t("addModel.addModelModes.customLabel", { defaultValue: "Custom - Use custom routing logic defined in config" }) },
];
