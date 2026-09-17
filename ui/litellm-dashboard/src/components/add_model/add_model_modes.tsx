// Define the available test modes
export const TEST_MODES = [
  {
    value: "chat",
    labelKey: "addModel.addModelModes.chatLabel",
    label: "Chat - /chat/completions",
  },
  {
    value: "completion",
    labelKey: "addModel.addModelModes.completionLabel",
    label: "Completion - /completions",
  },
  {
    value: "embedding",
    labelKey: "addModel.addModelModes.embeddingLabel",
    label: "Embedding - /embeddings",
  },
  {
    value: "audio_speech",
    labelKey: "addModel.addModelModes.audioSpeechLabel",
    label: "Audio Speech - /audio/speech",
  },
  {
    value: "audio_transcription",
    labelKey: "addModel.addModelModes.audioTranscriptionLabel",
    label: "Audio Transcription - /audio/transcriptions",
  },
  {
    value: "image_generation",
    labelKey: "addModel.addModelModes.imageGenerationLabel",
    label: "Image Generation - /images/generations",
  },
  { value: "image_edit", labelKey: "addModel.addModelModes.imageEditLabel", label: "Image Edit - /images/edits" },
  {
    value: "video_generation",
    labelKey: "addModel.addModelModes.videoGenerationLabel",
    label: "Video Generation - /videos",
  },
  { value: "rerank", labelKey: "addModel.addModelModes.rerankLabel", label: "Rerank - /rerank" },
  { value: "realtime", labelKey: "addModel.addModelModes.realtimeLabel", label: "Realtime - /realtime" },
  { value: "batch", labelKey: "addModel.addModelModes.batchLabel", label: "Batch - /batch" },
  { value: "ocr", labelKey: "addModel.addModelModes.ocrLabel", label: "OCR - /ocr" },
];

// Define the available auto router routing strategies
export const AUTO_ROUTER_MODES = [
  {
    value: "simple-shuffle",
    labelKey: "addModel.addModelModes.simpleShuffleLabel",
    label: "Simple Shuffle - Random selection from available models",
  },
  {
    value: "least-busy",
    labelKey: "addModel.addModelModes.leastBusyLabel",
    label: "Least Busy - Route to model with lowest current load",
  },
  {
    value: "latency-based",
    labelKey: "addModel.addModelModes.latencyBasedLabel",
    label: "Latency Based - Route to model with best response time",
  },
  {
    value: "cost-based",
    labelKey: "addModel.addModelModes.costBasedLabel",
    label: "Cost Based - Route to most cost-effective model",
  },
  {
    value: "usage-based",
    labelKey: "addModel.addModelModes.usageBasedLabel",
    label: "Usage Based - Route based on historical usage patterns",
  },
  {
    value: "custom",
    labelKey: "addModel.addModelModes.customLabel",
    label: "Custom - Use custom routing logic defined in config",
  },
];
