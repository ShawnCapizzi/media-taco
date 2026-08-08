// Shared types and product constants for Media Taco Community.

export type Role = "member" | "founder" | "moderator" | "researcher" | "admin";
export type Visibility = "private" | "link" | "community" | "public";
export type TacoStatus = "draft" | "published" | "hidden";

export type IngredientType =
  | "image"
  | "text"
  | "link"
  | "video_link"
  | "video_upload"
  | "audio"
  | "location"
  | "quote"
  | "creative_project"
  | "question";

export type ReactionType = "appreciate" | "relate" | "tell_me_more";

export interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  interests: string[];
  role: Role;
  founding_status: boolean;
  is_minor: boolean;
  open_to_collaboration: boolean;
  profile_visibility: "public" | "community" | "private";
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  starter_prompt: string;
  suggested_ingredients: string[];
  active: boolean;
  founder_only: boolean;
  position: number;
}

export interface Taco {
  id: string;
  creator_id: string;
  template_id: string | null;
  title: string;
  slug: string;
  description: string;
  introduction: string;
  cover_url: string | null;
  community_prompt: string | null;
  visibility: Visibility;
  status: TacoStatus;
  featured: boolean;
  collaborative: boolean;
  inspired_by_taco_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface IngredientMetadata {
  vibe?: string;
  preview?: {
    title?: string;
    description?: string;
    image?: string;
    site?: string;
  };
}

export interface Ingredient {
  id: string;
  taco_id: string;
  creator_id: string;
  type: IngredientType;
  title: string;
  description: string;
  why_it_matters: string;
  media_url: string | null;
  external_url: string | null;
  alt_text: string | null;
  attribution: string | null;
  location_name: string | null;
  happened_on: string | null;
  position: number;
  visibility: "inherit" | "private";
  metadata_json?: IngredientMetadata | null;
}

export interface ResponseRow {
  id: string;
  user_id: string;
  taco_id: string;
  body: string;
  response_type: string;
  media_url: string | null;
  created_at: string;
  users?: Pick<Profile, "username" | "display_name" | "founding_status"> | null;
}

export const INGREDIENT_TYPES: {
  value: IngredientType;
  label: string;
  hint: string;
}[] = [
  { value: "link", label: "Link", hint: "Paste anything: social posts, videos, songs, articles" },
  { value: "image", label: "Image", hint: "A photo or picture, uploaded or linked" },
  { value: "text", label: "Story", hint: "A written memory, story, or explanation" },
  { value: "video_link", label: "Video link", hint: "A YouTube, Vimeo, or other video URL" },
  { value: "audio", label: "Song or audio", hint: "A song, album, podcast, or sound" },
  { value: "location", label: "Place", hint: "A restaurant, neighborhood, or meaningful spot" },
  { value: "quote", label: "Quote", hint: "Words worth keeping, with attribution" },
  { value: "video_upload", label: "Short video", hint: "Upload a short clip, 90 seconds or less" },
  { value: "creative_project", label: "Creative work", hint: "Something you made" },
  { value: "question", label: "Question", hint: "Ask the community something" },
];

// One-tap feeling tags. Low effort, high signal.
export const VIBES: string[] = [
  "This is the shit!",
  "I can relate",
  "Retro",
  "Core memory",
  "Comfort",
  "Hype",
  "Slept on",
  "Made me cry",
];

// Per-type accent system: explicit class strings so Tailwind can see them.
export const INGREDIENT_ACCENTS: Record<
  IngredientType,
  { bar: string; eyebrow: string }
> = {
  link: { bar: "bg-blue", eyebrow: "text-blue" },
  image: { bar: "bg-mango", eyebrow: "text-mango-deep" },
  text: { bar: "bg-verde", eyebrow: "text-verde" },
  video_link: { bar: "bg-violet", eyebrow: "text-violet" },
  video_upload: { bar: "bg-violet", eyebrow: "text-violet" },
  audio: { bar: "bg-chile", eyebrow: "text-chile" },
  location: { bar: "bg-avocado", eyebrow: "text-avocado-deep" },
  quote: { bar: "bg-violet", eyebrow: "text-violet" },
  creative_project: { bar: "bg-mango", eyebrow: "text-mango-deep" },
  question: { bar: "bg-blue", eyebrow: "text-blue" },
};

export const REACTIONS: { value: ReactionType; label: string }[] = [
  { value: "appreciate", label: "Appreciate" },
  { value: "relate", label: "I relate" },
  { value: "tell_me_more", label: "Tell me more" },
];

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate or dehumanization" },
  { value: "sexual_exploitation", label: "Sexual exploitation" },
  { value: "nonconsensual_content", label: "Nonconsensual personal content" },
  { value: "doxxing", label: "Doxxing" },
  { value: "impersonation", label: "Impersonation" },
  { value: "copyright", label: "Stolen copyrighted content" },
  { value: "spam", label: "Spam" },
  { value: "dangerous_activity", label: "Dangerous or illegal activity" },
  { value: "misleading_attribution", label: "Misleading attribution" },
  { value: "other", label: "Something else" },
];

export const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  hint: string;
}[] = [
  { value: "private", label: "Private", hint: "Only you can see this Taco" },
  { value: "link", label: "Shared by link", hint: "Anyone with the link can view it; it never appears in Explore" },
  { value: "community", label: "Community only", hint: "Visible to signed-in Media Taco members with the link" },
  { value: "public", label: "Public", hint: "Anyone can find it in Explore and view it" },
];

export function ingredientLabel(type: IngredientType): string {
  return INGREDIENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return base ? `${base}-${suffix}` : `taco-${suffix}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const MIN_AGE = 13;
export const CURRENT_YEAR = new Date().getFullYear();

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}
