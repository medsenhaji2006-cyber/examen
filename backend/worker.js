import { MongoClient } from "mongodb";

const json = (data, status = 200, origin = "*") =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

export default {
  async fetch(request, env, ctx) {
    const origin = env.ALLOWED_ORIGINS?.split(",")[0]?.trim() || "*";
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") return json({}, 204, origin);

    if (pathname === "/api/health" && request.method === "GET") {
      return json({ status: "ok", platform: "cloudflare", env: env.NODE_ENV || "development" }, 200, origin);
    }

    if (pathname === "/api/items") {
      const client = new MongoClient(env.MONGODB_URI);
      try {
        await client.connect();
        const items = client.db().collection("items");

        if (request.method === "GET") {
          const list = await items.find().sort({ createdAt: -1 }).toArray();
          return json(list, 200, origin);
        }

        if (request.method === "POST") {
          let body;
          try { body = await request.json(); }
          catch { return json({ error: "JSON invalide" }, 400, origin); }

          const name = typeof body.name === "string" ? body.name.trim() : "";
          if (!name) return json({ error: "Le champ 'name' est requis" }, 400, origin);

          const requestId = typeof body.requestId === "string" ? body.requestId : undefined;
          const now = new Date();
          const doc = {
            name,
            description: typeof body.description === "string" ? body.description.trim() : "",
            createdAt: now,
            updatedAt: now,
            ...(requestId && { requestId }),
          };

          await items.createIndex({ requestId: 1 }, { unique: true, sparse: true });
          try {
            const result = await items.insertOne(doc);
            return json({ _id: result.insertedId, ...doc }, 201, origin);
          } catch (e) {
            if (e.code === 11000 && requestId) {
              return json(await items.findOne({ requestId }), 200, origin);
            }
            throw e;
          }
        }

        return json({ error: "Méthode non autorisée" }, 405, origin);
      } catch (e) {
        console.error(e);
        return json({ error: "Erreur serveur" }, 500, origin);
      } finally {
        ctx.waitUntil(client.close());
      }
    }

    return json({ error: "Route introuvable" }, 404, origin);
  },
};