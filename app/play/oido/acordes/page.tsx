import { currentStudent } from "@/lib/session";
import AcordesMenu from "./AcordesMenu";

export default async function AcordesOidoMenuPage() {
  return <AcordesMenu signedIn={Boolean(await currentStudent())} />;
}
