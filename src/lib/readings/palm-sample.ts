import type { PalmHand } from "./palm";

/** Illustrative example for the public palmistry page (clearly labelled as a sample). */
export const SAMPLE_HAND: PalmHand = {
  side: "right", isPalm: true, palmShape: { type: "earth", basis: "square palm, fingers about as long as the palm is wide" },
  lines: [
    { line: "life", visibility: "clear", length: "long", shape: "curved", features: [], observation: "A deep, wide arc that sweeps well around the thumb base." },
    { line: "head", visibility: "clear", length: "long", shape: "straight", features: ["joined_life_line"], observation: "Starts joined to the life line, then runs straight across the palm." },
    { line: "heart", visibility: "clear", length: "long", shape: "curved", features: ["fork"], observation: "Curves up towards the gap between the index and middle fingers, ending in a small fork." },
    { line: "fate", visibility: "faint", length: "medium", shape: "straight", features: [], observation: "A faint line rising from the middle of the palm." },
    { line: "sun", visibility: "faint", length: "short", shape: "straight", features: [], observation: "A short line under the ring finger." },
    { line: "mercury", visibility: "not_visible", length: "unclear", shape: "unclear", features: [], observation: "" },
  ],
  mounts: [
    { mount: "venus", prominence: "prominent", observation: "Full and rounded." }, { mount: "jupiter", prominence: "average", observation: "" },
    { mount: "moon", prominence: "average", observation: "" }, { mount: "saturn", prominence: "flat", observation: "" },
    { mount: "sun", prominence: "unclear", observation: "" }, { mount: "mercury", prominence: "unclear", observation: "" },
    { mount: "mars_upper", prominence: "unclear", observation: "" }, { mount: "mars_lower", prominence: "average", observation: "" },
  ],
};
