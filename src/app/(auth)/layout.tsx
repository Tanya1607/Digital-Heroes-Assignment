export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
