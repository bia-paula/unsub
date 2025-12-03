import { renderHtml } from "./renderHtml";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname === "/api/unsubscriptions") {
			if (request.method === "GET") {
				const { results } = await env.DB.prepare(
					"SELECT * FROM unsubscriptions ORDER BY created_at DESC"
				).all();
				return Response.json(results);
			} else if (request.method === "POST") {
				const { domain } = await request.json<{ domain: string }>();
				if (!domain) {
					return new Response("Domain is required", { status: 400 });
				}

				await env.DB.prepare("INSERT INTO unsubscriptions (domain) VALUES (?)")
					.bind(domain)
					.run();
				return new Response("Unsubscription added", { status: 201 });
			}
		} else if (pathname === "/") {
			return new Response(renderHtml(), {
				headers: {
					"content-type": "text/html",
				},
			});
		}

		return new Response("Not Found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
