import { Context, Hono } from "hono";
import { env } from "hono/adapter";
import {
  convertSearchResultsToPocketArticles,
  articleToPocketFormatFromWallaBag,
} from "./lib/pocketConverter";
import { WallaBagClient } from "./lib/wallabagClient";

type Bindings = {
  WALLABAG_URL: string;
  WALLABAG_CLIENT_ID: string;
  WALLABAG_CLIENT_SECRET: string;
  WALLABAG_USERNAME: string;
  WALLABAG_PASSWORD: string;
  ACCESS_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const getWallaBagClient = async (c: Context): Promise<WallaBagClient> => {
  const {
    WALLABAG_URL,
    WALLABAG_USERNAME,
    WALLABAG_PASSWORD,
    WALLABAG_CLIENT_ID,
    WALLABAG_CLIENT_SECRET,
  } = env<Bindings>(c);
  return new WallaBagClient(
    WALLABAG_URL,
    WALLABAG_USERNAME,
    WALLABAG_PASSWORD,
    WALLABAG_CLIENT_ID,
    WALLABAG_CLIENT_SECRET
  );
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
  const { actions } = data;
  const client = await getWallaBagClient(c);
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
  const accessToken = c.req.query("access_token");

  const data = await c.req.json();
  console.log(data);
  const client = await getWallaBagClient(c);
  const articles = await client.fetchPages(data.since || 0);
  const converted = convertSearchResultsToPocketArticles(
    articles,
    data.since || 0
  );
  return c.json(converted);
});

app.post("/v3beta/text", async (c) => {
  const body = await c.req.formData();
  console.log(body);
  const url = body.get("url")!.toString();
  const splits = url.split("#");
  const id = splits[splits.length - 1];
  const client = await getWallaBagClient(c);
  const article = await client.fetchPage(id);

  return c.json(articleToPocketFormatFromWallaBag(article));
});

export default app;
