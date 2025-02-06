import {
  type HoarderBookmark,
  type HoarderBookmarkResponse,
  type HoarderResponse,
} from "../types/HoarderSchema";

export class HoarderClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 404) {
        return response.json();
      }
      const error = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${error.message}`
      );
    }
    return response.json();
  }

  async fetchPages(since: number, cursor?: string): Promise<HoarderBookmark[]> {
    const baseUrl = `${this.apiUrl}/api/v1/bookmarks`;
    let url = baseUrl;
    if (cursor) {
      url += "?cursor=" + cursor;
    }
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<HoarderBookmarkResponse>(response);

    if (result.bookmarks.length == 0) {
      return [];
    }

    let res: HoarderBookmark[] = [];
    const lastAddingTime = new Date(
      result.bookmarks[result.bookmarks.length - 1].createdAt
    );

    if (result.nextCursor != null && lastAddingTime.getTime() > since * 1000) {
      res = res.concat(await this.fetchPages(since, result.nextCursor));
    }
    return result.bookmarks.concat(res);
  }

  async fetchPage(id: string): Promise<HoarderBookmark> {
    const response = await fetch(`${this.apiUrl}/api/v1/bookmarks/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<HoarderBookmark>(response);
    return result;
  }

  async actions(data: { item_id: number; action: string }): Promise<boolean> {
    const { item_id, action } = data;
    const body: { archived?: boolean; favourited?: boolean } = {};

    switch (action) {
      case "archive":
        body.archived = true;
        break;
      case "readd":
        body.archived = false;
        break;
      case "favorite":
        body.favourited = true;
        break;
      case "unfavorite":
        body.favourited = false;
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    const response = await fetch(`${this.apiUrl}/api/v1/bookmarks/${item_id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    await this.handleResponse<HoarderResponse<HoarderBookmark>>(response);
    return true;
  }

  async addLink(url: string): Promise<HoarderBookmark> {
    const response = await fetch(`${this.apiUrl}/api/v1/bookmarks`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ url, type: "link" }),
    });

    const result = await this.handleResponse<HoarderBookmark>(response);
    return result;
  }

  async deleteLink(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/api/v1/bookmarks/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    await this.handleResponse<{ success: boolean }>(response);
    return true;
  }
}
