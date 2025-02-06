export interface HoarderTag {
  id: string;
  name: string;
}

export interface HoarderAssets {
  id: string;
  assetType: string;
}

export interface HoarderBookmarkContent {
    text: string;
    type: string,
    url: string,
    title: string, 
    description: string,
    imageUrl: string,
    imageAssetId: string
    screenshotAssetId: string
    favicon: string,
    htmlContent: string,
    crawledAt: string
}

export interface HoarderBookmark {
  id: string;
  createdAt: string;
  modifiedAt: string;
  title: string;
  archived: boolean;
  favourited: boolean;
  note: string | null;
  summary: string;
  tags: HoarderTag[];
  content: HoarderBookmarkContent;
  asstes: HoarderAssets[];
}

export interface HoarderBookmarkResponse {
  bookmarks: HoarderBookmark[],
  nextCursor: string,
}

export interface HoarderResponse<T> {
  data: T;
}
