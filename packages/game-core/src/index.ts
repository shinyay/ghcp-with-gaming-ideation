export {
  hashCanonical,
  serializeIntegerState,
  type CanonicalIntegerField,
  type CanonicalIntegerValue
} from "./canonical";
export { nextXorShift32, type PrngStep } from "./prng";

export const FIXED_TICKS_PER_SECOND = 60;
