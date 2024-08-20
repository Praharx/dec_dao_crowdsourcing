import Appbar from "@/components/Appbar";
import NextTask from "@/components/NextTask";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-800">
      <Appbar />
      <NextTask />
    </main>
  );
}
