"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type FormState } from "@/app/actions/auth";

const initialState: FormState = {};

export function ProfileEditForm({
  defaults,
}: {
  defaults: {
    display_name: string;
    bio: string;
    interests: string;
    profile_visibility: string;
    open_to_collaboration: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary"
      >
        Edit profile
      </button>
    );
  }

  return (
    <form action={formAction} className="card p-5 max-w-xl space-y-4">
      {state.error && (
        <p role="alert" className="text-sm text-chile">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-verde">{state.message}</p>}

      <div>
        <label htmlFor="pf-display-name" className="label">
          Display name
        </label>
        <input
          id="pf-display-name"
          name="display_name"
          type="text"
          required
          maxLength={60}
          defaultValue={defaults.display_name}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="pf-bio" className="label">
          Short introduction
        </label>
        <textarea
          id="pf-bio"
          name="bio"
          rows={3}
          maxLength={400}
          defaultValue={defaults.bio}
          className="field"
          placeholder="What should people understand about you?"
        />
      </div>

      <div>
        <label htmlFor="pf-interests" className="label">
          Interests
        </label>
        <input
          id="pf-interests"
          name="interests"
          type="text"
          defaultValue={defaults.interests}
          className="field"
          placeholder="music, food, photography"
        />
        <p className="help">Separate with commas. Up to 12.</p>
      </div>

      <div>
        <label htmlFor="pf-visibility" className="label">
          Profile visibility
        </label>
        <select
          id="pf-visibility"
          name="profile_visibility"
          defaultValue={defaults.profile_visibility}
          className="field"
        >
          <option value="public">Public: anyone can view</option>
          <option value="community">Community: signed-in members only</option>
          <option value="private">Private: only you</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="pf-collab"
          name="open_to_collaboration"
          type="checkbox"
          defaultChecked={defaults.open_to_collaboration}
        />
        <label htmlFor="pf-collab" className="text-sm">
          Open to collaborating on Tacos
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary"
        >
          Close
        </button>
      </div>
    </form>
  );
}
