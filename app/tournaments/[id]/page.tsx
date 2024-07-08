import Link from "next/link";

export default function Page({ params }: { params: { id: string } }) {
  const tables = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ];
  params.id;
  return (
    <div className="h-dvh bg-slate-200">
      {tables.map((item: string) => (
        <div key={item} className="m-4">
          <Link className="border-slate-800 rounded bg-blue-200 p-1 px-8" href={`/tournaments/${params.id}/tables/${item}`}>Table {item}</Link>
        </div>
      ))}
    </div>
  );
}
