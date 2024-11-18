import { type Article, type SearchItemEdge } from "../types/OmnivoreSchema";
import { type WallaBagArticle } from "../types/WallabagSchema";

import { type PocketArticleMetadata } from "../types/PocketArticleMetadata";
import {
  type PocketGetArticles,
  type PocketList,
} from "../types/PocketGetArticles";
import { type PocketArticleDownload } from "../types/PocketTextArticle";
import { wordsToReadingTime } from "./utils";

const convertToPocketSchemea = (
  edge: SearchItemEdge
): PocketArticleMetadata => {
  const { node } = edge;

  return {
    item_id: node.id,
    resolved_id: node.slug,
    given_title: node.title,
    given_url: node.slug, // We turn this into the slug so that the subsequent request contains the slug item.
    resolved_title: node.title,
    resolved_url: node.slug,
    has_image: "1",
    word_count: node.wordsCount?.toString()!,
    image: {
      image_id: node.id,
      src: node.image!,
      width: "",
      height: "",
      item_id: node.id,
      caption: "",
      credit: "",
    },
    favorite: "0",
    time_added: Math.floor(
      new Date(node.savedAt.toString()).getTime() / 1000
    ).toString(),
    time_to_read: wordsToReadingTime(node.wordsCount ?? 1),
    time_updated: Math.floor(
      node.updatedAt
        ? new Date(node.updatedAt.toString()).getTime() / 1000
        : new Date(node.savedAt.toString()).getTime() / 1000
    ).toString(),
    time_read: "",
    status: "0",
    time_favorited: "",
    sort_id: 1,
    is_article: "1",
    is_index: "0",
    lang: "en",
    top_image_url: node.image ?? "",
    has_video: "0",
    listen_duration_estimate: 0,
    authors: {
      1: { item_id: "1", author_id: "1", name: node.author ?? "", url: "" },
    },
    excerpt: node.description ?? "",
    images: {},
    domain_metadata: {
      name: node.siteName ?? "",
      logo: node.siteIcon ?? "",
      greyscale_logo: node.siteIcon ?? "",
    },
  };
};

export const articleToPocketFormat = (
  article: Article
): PocketArticleDownload => {
  return {
    resolved_id: article.id,
    resolvedUrl: article.url,
    host: article.url,
    title: article.title,
    datePublished: article.createdAt,
    timePublished: article.createdAt,
    responseCode: 200,
    excerpt: article.description!,
    authors: article.author ?? "",
    images: article.image ?? "",
    videos: "",
    wordCount: article.wordsCount ?? 1,
    isArticle: 1,
    isVideo: 0,
    isIndex: 0,
    usedFallback: 0,
    requiresLogin: 0,
    lang: "en",
    topImageUrl: article.image!,
    article: article.content,
  };
};

const convertToPocketFromWallabagSchemea = (
  edge: WallaBagArticle
): PocketArticleMetadata => {
  // console.log(JSON.stringify(edge))
  const node = edge;
  // console.log("-----")

  return {
    item_id: node.id.toString(),
    resolved_id: node.hashed_url,
    given_title: node.title,
    given_url: node.url, // We turn this into the slug so that the subsequent request contains the slug item.
    resolved_title: node.title,
    resolved_url: node.url + "#" + node.id,
    has_image: "1",
    word_count: Math.floor(node.reading_time * 200).toString(),
    image: {
      image_id: node.id.toString(),
      src: node.preview_picture!,
      width: "",
      height: "",
      item_id: node.id.toString(),
      caption: "",
      credit: "",
    },
    favorite: node.is_starred ? "1" : "0",
    time_added: Math.floor(
      new Date(node.created_at.toString()).getTime() / 1000
    ).toString(),
    time_to_read: node.reading_time,
    time_updated: Math.floor(
      node.updated_at
        ? new Date(node.updated_at.toString()).getTime() / 1000
        : new Date(node.created_at.toString()).getTime() / 1000
    ).toString(),
    time_read: "",
    status: node.is_archived ? "1" : "0",
    time_favorited: node.starred_at
      ? Math.floor(new Date(node.starred_at.toString()).getTime() / 1000).toString()
      : "0",
    sort_id: 1,
    is_article: "1",
    is_index: "0",
    lang: node.language ?? "en",
    top_image_url: node.preview_picture ?? "",
    has_video: "0",
    listen_duration_estimate: 0,
    authors: {
      1: { item_id: "1", author_id: "1", name: node.published_by? node.published_by[0] : "", url: "" },
    },
    excerpt: "",
    images: {},
    domain_metadata: {
      name: "",
      logo: "",
      greyscale_logo: "",
    },
  };
};

export const articleToPocketFormatFromWallaBag = (
  article: WallaBagArticle
): PocketArticleDownload => {
  return {
    resolved_id: article.id.toString(),
    resolvedUrl: article.url + "#" + article.id,
    host: article.url,
    title: article.title,
    datePublished: 
      new Date(article.created_at.toString()),
    timePublished: Math.floor(
      new Date(article.created_at.toString()).getTime() / 1000
    ),
    responseCode: 200,
    excerpt: "",
    authors: article.published_by? article.published_by[0] : "",
    images: article.preview_picture ?? "",
    videos: "",
    wordCount: Math.floor(article.reading_time * 200) ?? 1,
    isArticle: 1,
    isVideo: 0,
    isIndex: 0,
    usedFallback: 0,
    requiresLogin: 0,
    lang: article.language ?? "en",
    topImageUrl: article.preview_picture,
    article: article.content,
  };
};

export const convertSearchResultsToPocketArticles = (
  articles: WallaBagArticle[],
  since: number
): PocketGetArticles => {
  console.log(articles.map((it) => it.id));
  const pocketMetadata = articles.map(convertToPocketFromWallabagSchemea);
  const convertedList = pocketMetadata.reduce<PocketList>(
    (prev, curr) => ({ ...prev, [curr.item_id]: curr }),
    {}
  );

  if (articles.length === 0) {
    return {
      status: 0,
      complete: 1,
      list: {},
      search_meta: {
        search_type: "normal",
      },
      error: null,
      since: since,
    }
  }

  return {
    status: 1,
    complete: 1,
    list: convertedList,
    search_meta: {
      search_type: "normal",
    },
    error: null,
    since: Math.floor(
      new Date(articles[articles.length - 1].updated_at || articles[articles.length - 1].created_at).getTime() / 1000
    ),
  };
};
