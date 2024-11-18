import { type WallaBagArticle } from "../types/WallabagSchema";

export class WallaBagClient {
  apiUrl: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;

  public constructor(
    apiUrl: string,
    username: string,
    password: string,
    clientId: string,
    clientSecret: string
  ) {
    this.apiUrl = apiUrl;
    this.username = username;
    this.password = password;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async login(): Promise<string> {
    const response = await fetch(`${this.apiUrl}/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.access_token;
  }

  async fetchPages(since: number): Promise<WallaBagArticle[]> {
    const token = await this.login();

    const response = await fetch(
      `${this.apiUrl}/api/entries?perPage=100&order=asc&detail=metadata&sort=updated&since=${since}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: { _embedded: { items: WallaBagArticle[] } } =
      await response.json();
    return result._embedded.items;
  }

  async fetchPage(id: string): Promise<WallaBagArticle> {
    const token = await this.login();

    const response = await fetch(`${this.apiUrl}/api/entries/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async actions(data: {item_id: number, action: string}): Promise<boolean> {
    const { item_id, action } = data;
    const token = await this.login();

    const url = `${this.apiUrl}/api/entries/${item_id}`;
    const body: { [key: string]: number } = {};
    switch (action) {
      case "archive":
        body["archive"] = 1;
        break;
      case "readd":
        body["archive"] = 0;
        break;
      case "favorite":
        body["starred"] = 1;
        break;
      case "unfavorite":
        body["starred"] = 0;
        break;
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }

  async addLink(url: string): Promise<boolean> {
    const token = await this.login();
    console.log(url);

    const response = await fetch(`${this.apiUrl}/api/entries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ url: url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }

  async deleteLink(id: string): Promise<boolean> {
    const token = await this.login();
    console.log(id);

    const response = await fetch(`${this.apiUrl}/api/entries/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  }
}
