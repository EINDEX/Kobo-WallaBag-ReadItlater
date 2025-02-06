import { Context, Hono } from "hono";
import { env } from "hono/adapter";
import {
  convertSearchResultsToPocketArticles,
  articleToPocketFormatFromHoarder,
} from "./lib/hoarderConverter";
import { HoarderClient } from "./lib/hoarderClient";

type Bindings = {
  HOARDER_URL: string;
  HOARDER_API_KEY: string;
  ACCESS_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const getHoarderClient = (c: Context): HoarderClient => {
  const { HOARDER_URL, HOARDER_API_KEY } = env<Bindings>(c);
  return new HoarderClient(HOARDER_URL, HOARDER_API_KEY);
};

app.use(async (c: Context, next) => {
  const accessToken = c.req.query("access_token")!;
  const { ACCESS_TOKEN } = env<{ ACCESS_TOKEN: string }>(c);
  if (accessToken !== ACCESS_TOKEN) {
    return c.body("Access Decline", 403);
  }
  await next();
});

app.post("/v3/send", async (c) => {
  const data = await c.req.json();
  console.log("/v3/send");
  const { actions } = data;
  const client = getHoarderClient(c);
  console.log(actions);
  const actionsList = actions
    .filter(
      (it: any) =>
        it.action === "archive" ||
        it.action === "readd" ||
        it.action === "favorite" ||
        it.action === "unfavorite"
    )
    .map((it: any) => {
      return {
        item_id: it.item_id,
        action: it.action,
      };
    });
  console.log(await Promise.all(actionsList.map(client.actions, client)));
  const addsList = actions
    .filter((it: any) => it.action === "add")
    .map((it: any) => it.url);
  console.log(await Promise.all(addsList.map(client.addLink, client)));

  const deletesList = actions
    .filter((it: any) => it.action === "delete")
    .map((it: any) => it.item_id);
  console.log(await Promise.all(deletesList.map(client.deleteLink, client)));

  return c.json({ action_results: [] });
});

app.post("/v3/get", async (c) => {
  const data = await c.req.json();
  console.log("/v3/get");
  const client = getHoarderClient(c);
  const bookmarks = await client.fetchPages(data.since || 0);
  const converted = convertSearchResultsToPocketArticles(
    bookmarks,
    data.since
  );
  return c.json(converted);
});

app.post("/v3beta/text", async (c) => {
  const body = await c.req.formData();
  console.log("/v3beta/text");
  const url = body.get("url")!.toString();
  const splits = url.split("#");
  const id = splits[splits.length - 1];
  const client = getHoarderClient(c);
  const bookmark = await client.fetchPage(id);

  return c.json(articleToPocketFormatFromHoarder(bookmark));
});

export default app;
