import * as A from "astronomy-engine";
import { DEG, norm360 } from "./math";
import { timeContext } from "./positions";

/**
 * True (osculating) lunar node: the ascending node of the Moon's instantaneous geocentric orbit,
 * from the orbital angular-momentum vector h = r × v in the true ecliptic of date.
 * Returns the sidereal longitude using the same convention as all other bodies.
 */
export function trueNodeSidereal(date: Date): number {
  const ctx = timeContext(date);
  const s = A.GeoMoonState(ctx.time);
  const rot = A.Rotation_EQJ_ECT(ctx.time);
  const r = A.RotateVector(rot, new A.Vector(s.x, s.y, s.z, ctx.time));
  const v = A.RotateVector(rot, new A.Vector(s.vx, s.vy, s.vz, ctx.time));
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  const tropicalTrue = Math.atan2(hx, -hy) / DEG;
  return norm360(tropicalTrue - ctx.dpsi - ctx.ayanamsa);
}
