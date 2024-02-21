import Image from "next/image";
import Darts from "./darts";
import Tournament from "./tournament";

export default function Page({
  params,
}: {
  params: { id: string; table: string };
}) {
  const table = decodeURIComponent(params.table);
  return (
    <>
      <Darts tournament={params.id} table={table} />
    </>
  );
}
