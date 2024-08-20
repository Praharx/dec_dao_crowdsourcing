import Appbar from "../components/Appbar";
import UploadImage from "../components/uploadImage";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-zinc-800">
      <Appbar />
      <UploadImage />
    </main>
  );
}
