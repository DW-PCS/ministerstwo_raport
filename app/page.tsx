import Login from "@/components/Login";
import RaportGenerator from "@/components/RaportGenerator";

export default function Home() {

  return (
    <div className="max-w-5xl m-auto mt-14">
      <Login />
      <RaportGenerator />
    </div>
  );
}
