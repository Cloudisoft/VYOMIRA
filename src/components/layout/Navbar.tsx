import { NavbarClient } from "./NavbarClient";

/** Static-friendly navbar: the signed-in state is resolved in the browser (no per-request DB lookup). */
export function Navbar() {
  return <NavbarClient />;
}
