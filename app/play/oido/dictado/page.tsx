import { currentStudent } from "@/lib/session";
import DictadoMenu from "./DictadoMenu";

export default async function DictadoMenuPage() {
  return <DictadoMenu signedIn={Boolean(await currentStudent())} />;
}
