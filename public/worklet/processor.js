class InputProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Do something with audio input if needed
    return true;
  }
}

registerProcessor("input-processor", InputProcessor);