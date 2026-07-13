export type ImagePayload = {
  url: string;
  publicId?: string;
};

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function normalizeImagePayload(input: unknown): ImagePayload[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (typeof item === "string") return { url: item };
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const url = value.url ? String(value.url).trim() : "";
      if (!url) return null;
      return {
        url,
        publicId: value.publicId ? String(value.publicId) : undefined,
      };
    })
    .filter(Boolean) as ImagePayload[];
}

