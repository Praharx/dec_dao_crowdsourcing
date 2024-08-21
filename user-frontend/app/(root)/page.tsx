import AppComponent from "@/components/AppComponent";
import Appbar from "../../components/Appbar";


export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-zinc-800">
      <Appbar />
      <AppComponent />
    </main>
  );
}
