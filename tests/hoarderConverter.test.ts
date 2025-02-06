import { describe, it, expect } from "vitest";
import {
  convertSearchResultsToPocketArticles,
  articleToPocketFormatFromHoarder,
} from "../lib/hoarderConverter";
import type { HoarderBookmark } from "../types/HoarderSchema";

describe("hoarderConverter", () => {
  const mockHoarderArticle: HoarderBookmark = {
    id: "123",
    title: "Test Article",
    note: "",
    summary: "",
    content: {
      url: "https://example.com",
      htmlContent: "Test content",
      type: "link",
      description:"Test description",
      imageUrl: "",
      imageAssetId: "",
      text: "",
      title: "",
      crawledAt: "",
      screenshotAssetId: "",
      favicon: "",
    },
    archived: false,
    favourited: false,
    tags: [{ id: "1", name: "test" }],
    createdAt: "2024-02-05T10:00:00Z",
    modifiedAt: "2024-02-05T11:00:00Z",
    asstes: []
  };

  describe("convertSearchResultsToPocketArticles", () => {
    it("should convert Hoarder articles to Pocket format", () => {
      const since = 1612345678;
      const articles = [mockHoarderArticle];

      const result = convertSearchResultsToPocketArticles(articles);

      expect(result).toEqual({
        status: 1,
        complete: 1,
        list: {
          "123": {
            item_id: "123",
            resolved_id: "123",
            given_url: "https://example.com",
            given_title: "Test Article",
            favorite: "0",
            status: "0",
            time_added: expect.any(String),
            time_updated: expect.any(String),
            time_read: "0",
            time_favorited: "0",
            sort_id: 0,
            resolved_title: "Test Article",
            resolved_url: "https://example.com",
            excerpt: "Test description",
            is_article: "1",
            is_index: "0",
            has_video: "0",
            has_image: "1",
            word_count: "2", // Based on content "Test content"
            tags: { test: { item_id: "123", tag: "test" } },
          },
        },
        since: since,
      });
    });

    it("should handle archived and favorited articles", () => {
      const archivedArticle: HoarderBookmark = {
        ...mockHoarderArticle,
        archived: true,
        favourited: true,
      };

      const result = convertSearchResultsToPocketArticles([archivedArticle]);

      expect(result.list["123"].status).toBe("1"); // archived
      expect(result.list["123"].favorite).toBe("1"); // favorited
    });
  });

  describe("articleToPocketFormatFromHoarder", () => {
    it("should convert a single Hoarder article to Pocket text format", () => {
      const result = articleToPocketFormatFromHoarder(mockHoarderArticle);

      expect(result).toEqual({
        article: mockHoarderArticle.content,
        title: mockHoarderArticle.title,
        word_count: 2,
        url: mockHoarderArticle.content.url,
        time_to_read: 5,
      });
    });
  });
});
