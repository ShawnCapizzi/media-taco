import Link from "next/link";
import { JoinForm } from "@/components/auth-forms";

export const metadata = { title: "Join" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <p className="eyebrow mb-2">Take a seat</p>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
        Join Media Taco
      </h1>
      <p className="text-sm text-ink-soft mt-2">
        Media Taco is for people 13 and older. Have a founding invitation code?
        Enter it below and your account gets Founding Table permissions.
      </p>
      <JoinForm inviteCode={code ?? ""} />
      <p className="text-sm text-ink-soft mt-6">
        Already a member?{" "}
        <Link href="/login" className="text-verde underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
