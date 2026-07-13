export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "O arquivo precisa ser uma imagem." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "A imagem deve ter no maximo 8 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = `data:${file.type};base64,${buffer.toString("base64")}`;

  return Response.json({ url }, { status: 201 });
}

export async function GET() {
  return new Response("Uploads are returned as data URLs on Vercel.", { status: 410 });
}
