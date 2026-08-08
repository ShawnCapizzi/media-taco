import { LoginForms } from "@/components/auth-forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <p className="eyebrow mb-2">Welcome back</p>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Sign in</h1>
      {error === "link" && (
        <p className="mt-3 text-sm text-chile">
          That sign-in link did not work. It may have expired; request a new
          one below.
        </p>
      )}
      <LoginForms next={next ?? "/home"} />
    </div>
  );
}
