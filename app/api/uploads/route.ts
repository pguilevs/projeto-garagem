export async function POST(request: Request) {
  const { env } = await import("cloudflare:workers");
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "O arquivo precisa ser uma imagem." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "A imagem deve ter no máximo 8 MB." }, { status: 413 });
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const key = `vehicles/${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return Response.json({ url: `/api/uploads?key=${encodeURIComponent(key)}` }, { status: 201 });
}

export async function GET(request: Request) {
  const { env } = await import("cloudflare:workers");
  const key = new URL(request.url).searchParams.get("key"); if (!key) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key); if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
