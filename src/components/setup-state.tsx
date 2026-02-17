interface SetupStateProps {
  title: string;
  message: string;
  details?: string;
}

export function SetupState({ title, message, details }: SetupStateProps) {
  return (
    <section className="rounded border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <h1 className="text-lg font-semibold text-amber-900">{title}</h1>
      <p className="mt-1 text-sm text-amber-800">{message}</p>
      {details ? (
        <pre className="mt-3 overflow-auto rounded border border-amber-200 bg-white p-2 font-mono text-xs text-amber-900">
          {details}
        </pre>
      ) : null}
    </section>
  );
}
