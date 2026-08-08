"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveTacoDraft, publishTaco } from "@/app/actions/tacos";
import {
  deleteIngredient,
  reorderIngredients,
  upsertIngredient,
} from "@/app/actions/ingredients";
import { fetchLinkPreview, type LinkPreview } from "@/app/actions/preview";
import { parseEmbed } from "@/lib/embeds";
import {
  INGREDIENT_TYPES,
  VIBES,
  VISIBILITY_OPTIONS,
  ingredientLabel,
  type Ingredient,
  type IngredientType,
  type Taco,
  type Template,
  type Visibility,
} from "@/lib/core";

type Step = "template" | "build" | "share";

interface IngredientFormValues {
  id?: string;
  type: IngredientType;
  title: string;
  description: string;
  why_it_matters: string;
  external_url: string;
  media_url: string;
  alt_text: string;
  attribution: string;
  location_name: string;
  happened_on: string;
  vibe: string;
  preview: LinkPreview | null;
}

const emptyIngredient = (type: IngredientType): IngredientFormValues => ({
  type,
  title: "",
  description: "",
  why_it_matters: "",
  external_url: "",
  media_url: "",
  alt_text: "",
  attribution: "",
  location_name: "",
  happened_on: "",
  vibe: "",
  preview: null,
});

const needsUrl = new Set<IngredientType>(["link", "video_link", "audio"]);
const needsUpload = new Set<IngredientType>(["image", "video_upload", "creative_project"]);

export function CreateWizard({
  templates,
  draft,
  initialIngredients,
  userId,
}: {
  templates: Template[];
  draft: Taco | null;
  initialIngredients: Ingredient[];
  userId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(draft ? "build" : "template");
  const [tacoId, setTacoId] = useState<string | null>(draft?.id ?? null);
  const [slug, setSlug] = useState<string | null>(draft?.slug ?? null);
  const [templateId, setTemplateId] = useState<string | null>(
    draft?.template_id ?? null
  );
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [introduction, setIntroduction] = useState(draft?.introduction ?? "");
  const [prompt, setPrompt] = useState(draft?.community_prompt ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    draft?.visibility ?? "private"
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [editing, setEditing] = useState<IngredientFormValues | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const template = templates.find((t) => t.id === templateId) ?? null;

  const persistDraft = useCallback(
    async (
      over?: Partial<{ template_id: string | null; visibility: Visibility; title: string }>
    ) => {
      setSaveState("saving");
      const result = await saveTacoDraft({
        id: tacoId ?? undefined,
        template_id: over?.template_id !== undefined ? over.template_id : templateId,
        title: over?.title ?? title,
        description,
        introduction,
        community_prompt: prompt,
        visibility: over?.visibility ?? visibility,
      });
      if (result.ok) {
        setTacoId(result.id);
        setSlug(result.slug);
        setSaveState("saved");
        setError(null);
        return result.id;
      }
      setSaveState("error");
      setError(result.error);
      return null;
    },
    [tacoId, templateId, title, description, introduction, prompt, visibility]
  );

  // Autosave basics after the draft exists.
  useEffect(() => {
    if (!tacoId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft();
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, introduction, prompt, tacoId]);

  async function chooseTemplate(id: string | null) {
    setTemplateId(id);
    // A Taco needs a title to publish; seed a real, editable one from the
    // template so the field is filled instead of only looking filled.
    const seeded = templates.find((t) => t.id === id)?.name ?? "";
    const nextTitle = title.trim() ? title : seeded;
    if (!title.trim() && seeded) setTitle(seeded);
    const created = await persistDraft({ template_id: id, title: nextTitle });
    if (created) setStep("build");
  }

  async function handleUpload(file: File): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        return null;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function maybeFetchPreview(url: string) {
    const trimmed = url.trim();
    if (!trimmed || !editing) return;
    // Players beat previews: embeddable links do not need OG cards.
    if (parseEmbed(trimmed)?.embedUrl) {
      setEditing((prev) => prev && { ...prev, preview: null });
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await fetchLinkPreview(trimmed);
      setEditing((prev) => prev && { ...prev, preview: result });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function saveIngredient() {
    if (!editing || !tacoId) return;
    if (!editing.title.trim()) {
      setError("Give this Ingredient a title.");
      return;
    }
    setError(null);
    const result = await upsertIngredient({
      id: editing.id,
      taco_id: tacoId,
      type: editing.type,
      title: editing.title,
      description: editing.description,
      why_it_matters: editing.why_it_matters,
      external_url: editing.external_url || null,
      media_url: editing.media_url || null,
      alt_text: editing.alt_text || null,
      attribution: editing.attribution || null,
      location_name: editing.location_name || null,
      happened_on: editing.happened_on || null,
      position: editing.id
        ? ingredients.find((i) => i.id === editing.id)?.position ?? ingredients.length + 1
        : ingredients.length + 1,
      metadata: {
        ...(editing.vibe ? { vibe: editing.vibe } : {}),
        ...(editing.preview?.ok
          ? {
              preview: {
                title: editing.preview.title,
                description: editing.preview.description,
                image: editing.preview.image,
                site: editing.preview.site,
              },
            }
          : {}),
      },
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIngredients((prev) => {
      const others = prev.filter((i) => i.id !== result.ingredient.id);
      return [...others, result.ingredient].sort((a, b) => a.position - b.position);
    });
    setEditing(null);
  }

  async function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    await deleteIngredient(id);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = ingredients.findIndex((i) => i.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ingredients.length) return;
    const next = [...ingredients];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const renumbered = next.map((i, n) => ({ ...i, position: n + 1 }));
    setIngredients(renumbered);
    await reorderIngredients(renumbered.map((i) => i.id));
  }

  async function handlePublish() {
    if (!tacoId) return;
    setPublishing(true);
    setError(null);
    const saved = await persistDraft();
    if (!saved) {
      setPublishing(false);
      return;
    }
    const result = await publishTaco(tacoId);
    setPublishing(false);
    if (result.ok) {
      router.push(`/t/${result.slug}`);
    } else {
      setError(result.error);
    }
  }

  // ---------------------------------------------------------------- render

  if (step === "template") {
    return (
      <div>
        <p className="eyebrow mb-2">Step 1 of 3</p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
          What kind of Taco are you building?
        </h1>
        <p className="text-sm text-ink-soft mt-2 max-w-xl">
          Templates give you a starting structure and suggested Ingredients.
          You can also start from scratch.
        </p>
        {error && (
          <p role="alert" className="card border-chile/60 p-3 text-sm text-chile mt-4">
            {error}
          </p>
        )}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void chooseTemplate(t.id)}
              className="card p-5 text-left hover:border-verde transition-colors"
            >
              <h2 className="font-display text-lg">{t.name}</h2>
              <p className="text-sm text-ink-soft mt-1">{t.description}</p>
              <p className="why-note mt-3 text-sm">{t.starter_prompt}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => void chooseTemplate(null)}
            className="card p-5 text-left border-dashed hover:border-verde transition-colors"
          >
            <h2 className="font-display text-lg">Start from scratch</h2>
            <p className="text-sm text-ink-soft mt-1">
              No template. Just a title and the things that matter.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "build") {
    return (
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Step 2 of 3{template ? ` · ${template.name}` : ""}</p>
          <p className="font-meta text-xs text-ink-soft" aria-live="polite">
            {saveState === "saving" && "Saving..."}
            {saveState === "saved" && "Draft saved"}
            {saveState === "error" && "Save failed"}
          </p>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight mt-1">
          Build your Taco
        </h1>
        {error && (
          <p role="alert" className="card border-chile/60 p-3 text-sm text-chile mt-4">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="cw-title" className="label">
              Title
            </label>
            <input
              id="cw-title"
              type="text"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your collection"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="cw-description" className="label">
              One-line description
            </label>
            <input
              id="cw-description"
              type="text"
              value={description}
              maxLength={300}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection, in a sentence?"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="cw-introduction" className="label">
              Introduction
            </label>
            <textarea
              id="cw-introduction"
              rows={4}
              value={introduction}
              maxLength={4000}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder={
                template?.starter_prompt ??
                "Set the scene. Why does this collection exist?"
              }
              className="field"
            />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-2xl">Ingredients</h2>
          <p className="text-sm text-ink-soft mt-1">
            Each Ingredient is one meaningful thing plus the reason it belongs.
            The reason is the part people remember.
          </p>
          {template && template.suggested_ingredients.length > 0 && (
            <p className="help mt-2">
              Suggested for this template:{" "}
              {template.suggested_ingredients.join(", ")}.
            </p>
          )}

          <ol className="mt-4 space-y-3">
            {ingredients.map((ing, idx) => (
              <li key={ing.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">{ingredientLabel(ing.type)}</p>
                    <p className="font-medium mt-0.5">{ing.title}</p>
                    {ing.why_it_matters && (
                      <p className="why-note mt-2 text-sm">{ing.why_it_matters}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void move(ing.id, -1)}
                      disabled={idx === 0}
                      aria-label={`Move ${ing.title} up`}
                      className="btn btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(ing.id, 1)}
                      disabled={idx === ingredients.length - 1}
                      aria-label={`Move ${ing.title} down`}
                      className="btn btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          id: ing.id,
                          type: ing.type,
                          title: ing.title,
                          description: ing.description,
                          why_it_matters: ing.why_it_matters,
                          external_url: ing.external_url ?? "",
                          media_url: ing.media_url ?? "",
                          alt_text: ing.alt_text ?? "",
                          attribution: ing.attribution ?? "",
                          location_name: ing.location_name ?? "",
                          happened_on: ing.happened_on ?? "",
                          vibe: ing.metadata_json?.vibe ?? "",
                          preview: ing.metadata_json?.preview
                            ? { ok: true, ...ing.metadata_json.preview }
                            : null,
                        })
                      }
                      className="btn btn-secondary px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeIngredient(ing.id)}
                      className="btn btn-secondary px-2 py-1 text-xs text-chile"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {!editing && (
            <div className="mt-4 flex flex-wrap gap-2">
              {INGREDIENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={async () => {
                    if (!tacoId) {
                      const created = await persistDraft();
                      if (!created) return;
                    }
                    setEditing(emptyIngredient(t.value));
                  }}
                  className="btn btn-secondary text-sm"
                  title={t.hint}
                >
                  + {t.label}
                </button>
              ))}
            </div>
          )}

          {editing && (
            <div className="card p-5 mt-4 space-y-3 border-verde">
              <p className="eyebrow">
                {editing.id ? "Edit" : "New"} {ingredientLabel(editing.type)}
              </p>
              {needsUrl.has(editing.type) && (
                <div>
                  <label htmlFor="ing-url" className="label">
                    Link
                  </label>
                  <input
                    id="ing-url"
                    type="url"
                    value={editing.external_url}
                    onChange={(e) =>
                      setEditing({ ...editing, external_url: e.target.value })
                    }
                    onBlur={(e) => void maybeFetchPreview(e.target.value)}
                    placeholder="Paste a link: YouTube, TikTok, Spotify, an article, anything"
                    className="field"
                    autoFocus
                  />
                  <p className="help">
                    Videos and songs play right inside your Taco. Other links
                    show a preview.
                  </p>
                  {previewLoading && <p className="help">Fetching preview...</p>}
                  {editing.preview?.ok && !previewLoading && (
                    <div className="card mt-2 flex items-center gap-3 p-2 overflow-hidden">
                      {editing.preview.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editing.preview.image}
                          alt=""
                          className="h-14 w-14 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0 text-sm">
                        <p className="font-medium truncate">
                          {editing.preview.title ?? "Preview"}
                        </p>
                        {editing.preview.site && (
                          <p className="text-xs text-ink-soft truncate">
                            {editing.preview.site}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {editing.preview && !editing.preview.ok && !previewLoading && (
                    <p className="help">{editing.preview.error}</p>
                  )}
                </div>
              )}

              {needsUpload.has(editing.type) && (
                <div>
                  <label htmlFor="ing-file" className="label">
                    {editing.type === "video_upload"
                      ? "Video file (90 seconds or less, up to 25MB)"
                      : "File (up to 25MB)"}
                  </label>
                  <input
                    id="ing-file"
                    type="file"
                    accept={
                      editing.type === "video_upload"
                        ? "video/mp4,video/quicktime,video/webm"
                        : "image/jpeg,image/png,image/webp,image/gif"
                    }
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await handleUpload(file);
                      if (url) setEditing((prev) => prev && { ...prev, media_url: url });
                    }}
                    className="field"
                  />
                  {uploading && <p className="help">Uploading...</p>}
                  {editing.media_url && !uploading && (
                    <p className="help text-verde">File attached.</p>
                  )}
                  {editing.type === "image" && (
                    <div className="mt-2">
                      <label htmlFor="ing-alt" className="label">
                        Alt text
                      </label>
                      <input
                        id="ing-alt"
                        type="text"
                        value={editing.alt_text}
                        maxLength={300}
                        onChange={(e) =>
                          setEditing({ ...editing, alt_text: e.target.value })
                        }
                        placeholder="Describe the image for people who cannot see it"
                        className="field"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="ing-title" className="label">
                  Title
                </label>
                <input
                  id="ing-title"
                  type="text"
                  value={editing.title}
                  maxLength={120}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="ing-description" className="label">
                  {editing.type === "question" ? "Your question" : "Description"}
                </label>
                <textarea
                  id="ing-description"
                  rows={3}
                  value={editing.description}
                  maxLength={2000}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="ing-why" className="label">
                  Why it matters
                </label>
                <textarea
                  id="ing-why"
                  rows={2}
                  value={editing.why_it_matters}
                  maxLength={1000}
                  onChange={(e) =>
                    setEditing({ ...editing, why_it_matters: e.target.value })
                  }
                  placeholder="The story or reason that makes this yours"
                  className="field"
                />
                <p className="help">
                  This appears as a highlighted note. It is the heart of the
                  Ingredient.
                </p>
              </div>

              <div>
                <span className="label">Tag the vibe (optional, one tap)</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vibe">
                  {VIBES.map((v, i) => {
                    const on = editing.vibe === v;
                    const palette = ["chip-mango", "chip-blue", "chip-avocado"][i % 3];
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setEditing({ ...editing, vibe: on ? "" : v })
                        }
                        className={`chip ${on ? "bg-ink text-raised border-ink" : palette} transition-transform active:scale-95`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>



              {editing.type === "location" && (
                <div>
                  <label htmlFor="ing-location" className="label">
                    Place name
                  </label>
                  <input
                    id="ing-location"
                    type="text"
                    value={editing.location_name}
                    maxLength={160}
                    onChange={(e) =>
                      setEditing({ ...editing, location_name: e.target.value })
                    }
                    placeholder="Neighborhood, city, or spot"
                    className="field"
                  />
                </div>
              )}

              {editing.type === "quote" && (
                <div>
                  <label htmlFor="ing-attr" className="label">
                    Attribution
                  </label>
                  <input
                    id="ing-attr"
                    type="text"
                    value={editing.attribution}
                    maxLength={200}
                    onChange={(e) =>
                      setEditing({ ...editing, attribution: e.target.value })
                    }
                    placeholder="Who said or wrote it"
                    className="field"
                  />
                </div>
              )}

              <div>
                <label htmlFor="ing-date" className="label">
                  Date (optional)
                </label>
                <input
                  id="ing-date"
                  type="date"
                  value={editing.happened_on}
                  onChange={(e) =>
                    setEditing({ ...editing, happened_on: e.target.value })
                  }
                  className="field max-w-[200px]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void saveIngredient()}
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  Save Ingredient
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setStep("template")}
            className="btn btn-secondary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={async () => {
              const saved = await persistDraft();
              if (saved) setStep("share");
            }}
            className="btn btn-primary"
          >
            Continue to sharing
          </button>
        </div>
      </div>
    );
  }

  // step === "share"
  return (
    <div>
      <p className="eyebrow mb-2">Step 3 of 3</p>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
        Who is this Taco for?
      </h1>
      {error && (
        <p role="alert" className="card border-chile/60 p-3 text-sm text-chile mt-4">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {VISIBILITY_OPTIONS.map((v) => (
          <label
            key={v.value}
            className={`card p-4 flex items-start gap-3 cursor-pointer ${
              visibility === v.value ? "border-verde" : ""
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value={v.value}
              checked={visibility === v.value}
              onChange={() => setVisibility(v.value)}
              className="mt-1"
            />
            <span>
              <span className="font-medium block">{v.label}</span>
              <span className="text-sm text-ink-soft">{v.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-8">
        <label htmlFor="cw-prompt" className="label">
          Community prompt (optional)
        </label>
        <input
          id="cw-prompt"
          type="text"
          value={prompt}
          maxLength={300}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask viewers a question they can answer with their own version"
          className="field"
        />
        <p className="help">
          Prompts invite responses and My Version remixes. Good ones are
          specific: what one song would explain you?
        </p>
      </div>

      <div className="card p-4 mt-8 bg-verde-soft border-verde/40">
        <p className="text-sm">
          <strong>Ready to publish?</strong> Your Taco has{" "}
          {ingredients.length} Ingredient{ingredients.length === 1 ? "" : "s"}.
          Publishing makes it visible per your choice above.
          {visibility === "private" &&
            " Private drafts publish as shared-by-link so at least you can share them."}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <button type="button" onClick={() => setStep("build")} className="btn btn-secondary">
          Back to building
        </button>
        <div className="flex gap-2">
          {slug && (
            <button
              type="button"
              onClick={async () => {
                const saved = await persistDraft();
                if (saved) router.push(`/t/${slug}`);
              }}
              className="btn btn-secondary"
            >
              Save draft and preview
            </button>
          )}
          <div className="text-right">
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing || ingredients.length === 0 || !title.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish Taco"}
            </button>
            {!title.trim() && (
              <p className="help mt-1.5 text-chile">
                Add a title in the building step to publish.
              </p>
            )}
            {title.trim() && ingredients.length === 0 && (
              <p className="help mt-1.5 text-chile">
                Add at least one Ingredient to publish.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
