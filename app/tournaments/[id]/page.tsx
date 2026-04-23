import Link from "next/link";
import type { RouteParams } from "@/app/lib/next-types";

export default async function Page({ params }: { params: RouteParams<{ id: string }> }) {
  const { id } = await params;
  const tables = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ];
  return (
    <div className="h-dvh bg-slate-200">
      {tables.map((item: string) => (
        <div key={item} className="m-4">
          <Link className="border-slate-800 rounded bg-blue-200 p-1 px-8" href={`/tournaments/${id}/tables/1${item}`}>Table {item}</Link>
        </div>
      ))}
      <div key="back" className="m-4">
        <Link className="border-slate-800 rounded bg-red-200 p-1 px-8" href={"/"}>Back</Link>
      </div>
    </div>
  );
}
