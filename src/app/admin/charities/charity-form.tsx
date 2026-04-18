"use client";

import { upsertCharityAction } from "./actions";

type Charity = {
  id?: string;
  slug?: string;
  name?: string;
  tagline?: string | null;
  description?: string;
  body?: string | null;
  hero_img?: string | null;
  featured?: boolean;
  active?: boolean;
};

export function CharityEditor({ charity }: { charity?: Charity }) {
  return (
    <form action={upsertCharityAction} className="space-y-4 max-w-2xl">
      {charity?.id && <input type="hidden" name="id" value={charity.id} />}
      <Field label="Name" name="name" defaultValue={charity?.name} required />
      <Field
        label="Slug"
        name="slug"
        defaultValue={charity?.slug}
        hint="lowercase, hyphens only"
        required
      />
      <Field
        label="Tagline"
        name="tagline"
        defaultValue={charity?.tagline ?? ""}
      />
      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={charity?.description}
          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Body (long-form, optional)</span>
        <textarea
          name="body"
          rows={6}
          defaultValue={charity?.body ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5"
        />
      </label>
      <Field
        label="Hero image URL"
        name="hero_img"
        type="url"
        defaultValue={charity?.hero_img ?? ""}
      />
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={charity?.featured} />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={charity?.active ?? true}
          />
          Active
        </label>
      </div>
      <button className="rounded-full bg-primary px-5 py-2 text-primary-foreground text-sm font-medium">
        Save
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5"
      />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
