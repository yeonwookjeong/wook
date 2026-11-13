import { redirect } from "next/navigation";

// The English site starts at the Korean name for now.
export default function EnHome() {
  redirect("/en/name");
}
