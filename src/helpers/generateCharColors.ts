const colors = [
  { background: "rgba(180, 151, 214, 0.2)", color: "#c900ff" }, // A - Bright purple
  { background: "rgba(255, 54, 54, 0.1)", color: "#ff0000" }, // B - Bright red
  { background: "rgba(54, 203, 255, 0.1)", color: "#02849e" }, // C - Bright cyan
  { background: "rgba(255, 182, 54, 0.1)", color: "#ff9c00" }, // D - Bright orange
  { background: "rgba(54, 255, 139, 0.1)", color: "#00b241" }, // E - Bright green
  { background: "rgba(255, 54, 182, 0.1)", color: "#ff00aa" }, // F - Bright pink
  { background: "rgba(151, 54, 255, 0.1)", color: "#bf00ff" }, // G - Bright violet
  { background: "rgba(221, 212, 147, 0.261)", color: "#a79900" }, // H - Bright yellow
  { background: "rgba(54, 151, 255, 0.1)", color: "#008cff" }, // I - Bright blue
  { background: "rgba(255, 54, 105, 0.1)", color: "#ff0033" }, // J - Bright red-pink
  { background: "rgba(132, 235, 35, 0.2)", color: "#73b803" }, // K - Bright lime
  { background: "rgba(54, 255, 233, 0.1)", color: "#009286" }, // L - Bright turquoise
  { background: "rgba(233, 54, 255, 0.1)", color: "#d100ff" }, // M - Bright magenta
  { background: "rgba(54, 255, 182, 0.2)", color: "#05c28a" }, // N - Bright aqua-green
  { background: "rgba(113, 89, 0, 0.1)", color: "#927c00" }, // O - Bright gold
  { background: "rgba(182, 54, 255, 0.1)", color: "#a100ff" }, // P - Bright purple
  { background: "rgba(255, 139, 54, 0.1)", color: "#ff7500" }, // Q - Bright orange-red
  { background: "rgba(54, 255, 54, 0.1)", color: "#009700" }, // R - Bright green
  { background: "rgba(255, 54, 54, 0.2)", color: "#ff3333" }, // S - Bright red
  { background: "rgba(54, 182, 255, 0.1)", color: "#00aaff" }, // T - Bright sky blue
  { background: "rgba(255, 54, 233, 0.1)", color: "#ff00d1" }, // U - Bright neon pink
  { background: "rgba(233, 255, 54, 0.1)", color: "#617700" }, // V - Bright neon yellow
  { background: "rgba(151, 54, 54, 0.1)", color: "#ff0033" }, // W - Bright crimson
  { background: "rgba(54, 255, 151, 0.1)", color: "#009b53" }, // X - Bright mint
  { background: "rgba(54, 54, 255, 0.1)", color: "#3333ff" }, // Y - Bright royal blue
  { background: "rgba(151, 233, 54, 0.1)", color: "#80b005" }, // Z - Bright lime-yellow
  { background: "rgba(128, 128, 128, 0.1)", color: "#808080" }, // Default grey
];

export function getColorByFirstLetter(input: string) {
  const firstLetter = input.charAt(0).toUpperCase();
  const letterIndex = firstLetter.charCodeAt(0) - 65;

  if (letterIndex >= 0 && letterIndex < 26) {
    return colors[letterIndex];
  } else {
    return colors[26];
  }
}
