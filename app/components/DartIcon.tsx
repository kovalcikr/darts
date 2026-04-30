export default function DartIcon({
  className = '',
  testId,
}: {
  className?: string
  testId?: string
}) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      data-testid={testId}
      draggable={false}
      src="/dart-leg-starter.png"
    />
  );
}
