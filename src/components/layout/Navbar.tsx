import { getSession } from "@/server/session";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  let signedIn = false;
  try {
    signedIn = Boolean(await getSession());
  } catch {
    signedIn = false;
  }
  return <NavbarClient signedIn={signedIn} />;
}
