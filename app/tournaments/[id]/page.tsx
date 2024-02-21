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
    <>
      {tables.map((item: string) => (
        <div key={item}>
          <Link href={`/tournaments/${params.id}/tables/${item}`}>Table {item}</Link>
        </div>
      ))}
    </>
  );
}
