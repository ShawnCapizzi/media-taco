"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  joinAction,
  loginAction,
  magicLinkAction,
  type FormState,
} from "@/app/actions/auth";
import { CURRENT_YEAR, MIN_AGE } from "@/lib/core";

const initialState: FormState = {};

export function JoinForm({
  inviteCode,
  next = "",
}: {
  inviteCode: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(joinAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error && (
        <p role="alert" className="card border-chile/60 p-3 text-sm text-chile">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="join-display-name" className="label">
          Display name
        </label>
        <input
          id="join-display-name"
          name="display_name"
          type="text"
          required
          maxLength={60}
          className="field"
          placeholder="How you want to appear"
        />
      </div>

      <div>
        <label htmlFor="join-username" className="label">
          Username
        </label>
        <input
          id="join-username"
          name="username"
          type="text"
          required
          pattern="[a-z0-9_]{3,24}"
          className="field"
          placeholder="lowercase_letters_numbers"
        />
        <p className="help">3 to 24 characters. This becomes your profile URL.</p>
      </div>

      <div>
        <label htmlFor="join-email" className="label">
          Email
        </label>
        <input
          id="join-email"
          name="email"
          type="email"
          required
          className="field"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="join-password" className="label">
          Password
        </label>
        <input
          id="join-password"
          name="password"
          type="password"
          required
          minLength={8}
          className="field"
          autoComplete="new-password"
        />
        <p className="help">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="join-birth-year" className="label">
          Year you were born
        </label>
        <input
          id="join-birth-year"
          name="birth_year"
          type="number"
          inputMode="numeric"
          required
          min={1900}
          max={CURRENT_YEAR}
          className="field"
          placeholder="For example, 1992"
        />
        <p className="help">
          Media Taco is for people {MIN_AGE} and older. We store the year only.
        </p>
      </div>

      <div>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="join-invite" className="label">
          Invitation code (optional)
        </label>
        <input
          id="join-invite"
          name="invite_code"
          type="text"
          defaultValue={inviteCode}
          className="field"
          placeholder="FOUNDING-TABLE"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="join-agree"
          name="agree_standards"
          type="checkbox"
          required
          className="mt-1"
        />
        <label htmlFor="join-agree" className="text-sm">
          I agree to the{" "}
          <Link href="/about" className="text-verde underline underline-offset-2">
            community standards
          </Link>
          .
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
        {pending ? "Creating your seat..." : "Join Media Taco"}
      </button>
    </form>
  );
}

export function LoginForms({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [magicState, magicFormAction, magicPending] = useActionState(
    magicLinkAction,
    initialState
  );

  return (
    <div className="mt-6 space-y-8">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <p role="alert" className="card border-chile/60 p-3 text-sm text-chile">
            {state.error}
          </p>
        )}
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            className="field"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            className="field"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary w-full justify-center">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="border-t border-line pt-6">
        <p className="text-sm text-ink-soft mb-3">
          Prefer not to type a password? Get a one-time sign-in link.
        </p>
        <form action={magicFormAction} className="flex gap-2">
          <label htmlFor="magic-email" className="sr-only">
            Email for sign-in link
          </label>
          <input
            id="magic-email"
            name="email"
            type="email"
            required
            className="field"
            placeholder="you@example.com"
          />
          <button type="submit" disabled={magicPending} className="btn btn-secondary whitespace-nowrap">
            Email me a link
          </button>
        </form>
        {magicState.message && (
          <p className="help mt-2 text-verde">{magicState.message}</p>
        )}
        {magicState.error && (
          <p role="alert" className="help mt-2 text-chile">
            {magicState.error}
          </p>
        )}
      </div>

      <p className="text-sm text-ink-soft">
        New here?{" "}
        <Link href="/join" className="text-verde underline underline-offset-2">
          Join Media Taco
        </Link>
      </p>
    </div>
  );
}
