import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Backdrop from "../components/Backdrop";
import SiteFooter from "../components/SiteFooter";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contacto · 21st Century Music" };

export default function ContactoPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 md:px-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/40 hover:text-white"
        >
          <ArrowLeft size={14} />
          Volver
        </Link>

        <main className="flex flex-1 items-center justify-center py-8">
          <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-300">
              Contacto
            </p>
            <h1 className="mt-2 text-2xl font-black italic tracking-tight md:text-3xl">
              Escríbenos
            </h1>
            <p className="mt-2.5 text-xs leading-5 text-white/45">
              Un fallo, algo que no carga, una idea para un modo nuevo. Las dudas de teoría,
              mejor en clase.
            </p>

            <div className="mt-5">
              <ContactForm />
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
