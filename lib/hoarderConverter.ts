import type { HoarderBookmark } from "../types/HoarderSchema";
import type { PocketArticleMetadata } from "../types/PocketArticleMetadata";
import type { PocketGetArticles, PocketList } from "../types/PocketGetArticles";
import type { PocketArticleDownload } from "../types/PocketTextArticle";
import { wordsToReadingTime } from "./utils";
import { marked } from "marked";

export function articleToPocketFormatFromHoarder(
  bookmark: HoarderBookmark
): PocketArticleDownload {
  const timeAdded = new Date(bookmark.createdAt);
  const url =
    (bookmark.content.type == "link"
      ? bookmark.content.url
      : "https://website.notexist/") +
    "#" +
    bookmark.id;
  const content: string =
    bookmark.content.type == "link"
      ? bookmark.content.htmlContent
      : marked(bookmark.content.text, { async: false });
  const wordCount = content.split(/\s+/).length;

  return {
    resolved_id: bookmark.id,
    resolvedUrl: url,
    host: new URL(url).host,
    title: bookmark.title,
    datePublished: timeAdded,
    timePublished: timeAdded.getTime() / 1000,
    responseCode: 200,
    excerpt: bookmark.summary,
    authors: "",
    images: "",
    videos: "",
    wordCount: wordCount,
    isArticle: 1,
    isVideo: 0,
    isIndex: 0,
    usedFallback: 0,
    requiresLogin: 0,
    lang: "en",
    topImageUrl: bookmark.content.imageUrl ?? "",
    article: content,
  };
}

const convertToPocketSchemea = (
  bookmark: HoarderBookmark
): PocketArticleMetadata | null => {
  try {
    const timeAdded = new Date(bookmark.createdAt).getTime() / 1000;
    const timeUpdated = new Date(bookmark.modifiedAt).getTime() / 1000;

    if (bookmark.content.type == "link") {
      if (bookmark.content.htmlContent == null) {
        return null;
      }
      const wordCount = bookmark.content.htmlContent.split(/\s+/).length;

      return {
        item_id: bookmark.id,
        resolved_id: bookmark.id,
        given_title: bookmark.title,
        given_url: bookmark.content.url + "#" + bookmark.id, // We turn this into the slug so that the subsequent request contains the slug item.
        resolved_title: bookmark.title,
        resolved_url: bookmark.content.url + "#" + bookmark.id,
        has_image: "1",
        word_count: wordCount.toString(),
        image: {
          image_id: bookmark.id,
          src: bookmark.content.imageUrl!,
          width: "",
          height: "",
          item_id: bookmark.id,
          caption: "",
          credit: "",
        },
        favorite: bookmark.favourited ? "1" : "0",
        time_added: Math.floor(timeAdded).toString(),
        time_to_read: wordsToReadingTime(wordCount ?? 1),
        time_updated: Math.floor(timeUpdated).toString(),
        time_read: "",
        status: bookmark.archived ? "1" : "0",
        time_favorited: "",
        sort_id: 1,
        is_article: "1",
        is_index: "0",
        lang: "en",
        top_image_url: bookmark.content.imageUrl ?? "",
        has_video: "0",
        listen_duration_estimate: 0,
        authors: {
          // 1: { item_id: "1", author_id: "1", name: bookmark.author ?? "", url: "" },
        },
        excerpt: bookmark.summary ?? "",
        images: {},
        domain_metadata: {
          name: "",
          logo: bookmark.content.favicon ?? "",
          greyscale_logo: "",
        },
      };
    } else if (bookmark.content.type == "text") {
      const wordCount = bookmark.content.text.split(/\s+/).length;

      return {
        item_id: bookmark.id,
        resolved_id: bookmark.id,
        given_title: bookmark.title,
        given_url: "https://website.notexist/" + "#" + bookmark.id, // We turn this into the slug so that the subsequent request contains the slug item.
        resolved_title: bookmark.title,
        resolved_url: "https://website.notexist/" + "#" + bookmark.id,
        has_image: "1",
        word_count: wordCount.toString(),
        image: {
          image_id: "",
          src: "",
          width: "",
          height: "",
          item_id: bookmark.id,
          caption: "",
          credit: "",
        },
        favorite: "0",
        time_added: Math.floor(timeAdded).toString(),
        time_to_read: wordsToReadingTime(wordCount ?? 1),
        time_updated: Math.floor(timeUpdated).toString(),
        time_read: "",
        status: "0",
        time_favorited: "",
        sort_id: 1,
        is_article: "1",
        is_index: "0",
        lang: "en",
        top_image_url: "",
        has_video: "0",
        listen_duration_estimate: 0,
        authors: {
          // 1: { item_id: "1", author_id: "1", name: bookmark.author ?? "", url: "" },
        },
        excerpt: bookmark.summary ?? "",
        images: {},
        domain_metadata: {
          name: "",
          logo: "",
          greyscale_logo: "",
        },
      };
    }
    return null;
  } catch (error) {
    console.log(bookmark);
    throw error;
  }
};

export const convertSearchResultsToPocketArticles = (
  articles: HoarderBookmark[]
): PocketGetArticles => {
  const pocketMetadatas = articles
    .map(convertToPocketSchemea)
    .filter((x) => x != null);
  const convertedList = pocketMetadatas.reduce<PocketList>(
    (prev, curr) => ({ ...prev, [curr.item_id]: curr }),
    {}
  );

  const since = new Date(articles[0].createdAt).getTime() / 1000;
  return {
    status: 1,
    complete: 1,
    list: convertedList,
    search_meta: {
      search_type: "normal",
    },
    error: null,
    since: since,
  };
};
