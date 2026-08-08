"use client";

import { useState } from "react";
import { submitReport } from "@/app/actions/community";
import { REPORT_REASONS } from "@/lib/core";

export function ReportForm({
  targetType,
  targetId,
  slug,
}: {
  targetType: string;
  targetId: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="text-sm text-ink-soft">
        Report received. A moderator will review it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-soft hover:text-chile underline underline-offset-2"
      >
        Report this content
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await submitReport(formData);
        setSent(true);
      }}
      className="card p-4 max-w-md"
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="report-reason" className="label">
        What is wrong with this content?
      </label>
      <select id="report-reason" name="reason" className="field" required>
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <label htmlFor="report-description" className="label mt-3">
        Anything a moderator should know (optional)
      </label>
      <textarea
        id="report-description"
        name="description"
        rows={2}
        maxLength={1000}
        className="field"
      />
      <div className="mt-3 flex gap-2">
        <button type="submit" className="btn btn-primary text-sm">
          Send report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
