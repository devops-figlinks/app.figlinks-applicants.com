class InputProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Float32 PCM → send to main thread
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor("input-processor", InputProcessor);
