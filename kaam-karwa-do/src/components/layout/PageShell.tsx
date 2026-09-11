export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-slate-500">{subtitle}</p>
      )}
      {children && <div className="prose mt-8 max-w-2xl">{children}</div>}
    </div>
  );
}
