class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Send raw Float32 PCM back to main thread
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor("mic-processor", MicProcessor);
