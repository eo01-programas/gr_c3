export async function onRequest({ request }) {
  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing ?url=" }), {
      status: 400,
      headers: { ...cors(), "content-type": "application/json; charset=utf-8" }
    });
  }

  // Seguridad: evita proxy abierto
  const allowedPrefix =
    "https://e-factura.sunat.gob.pe/v1/contribuyente/gre/comprobantes/descargaqr?hashqr=";

  if (!target.startsWith(allowedPrefix)) {
    return new Response(JSON.stringify({ error: "URL not allowed" }), {
      status: 403,
      headers: { ...cors(), "content-type": "application/json; charset=utf-8" }
    });
  }

  const upstream = await fetch(target, {
    method: "GET",
    headers: {
      "Accept": "application/pdf,*/*",
      "User-Agent": "Mozilla/5.0"
    },
    redirect: "follow"
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "Upstream error", status: upstream.status }), {
      status: 502,
      headers: { ...cors(), "content-type": "application/json; charset=utf-8" }
    });
  }

  const contentType = upstream.headers.get("content-type") || "application/pdf";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...cors(),
      "content-type": contentType
    }
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
