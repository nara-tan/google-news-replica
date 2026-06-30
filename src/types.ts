export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceIconUrl?: string;
  imageUrl?: string;
  summary: string;
  content: string;
  time: string;
  category: string;
  featured: boolean;
  url?: string;
  bullets?: string[];
  groundingUrls?: string[];
}

export interface InterestTopic {
  id: string;
  name: string;
  addedAt: string;
}

export interface FeedResponse {
  articles: NewsArticle[];
  personalizedBriefing?: string; // Markdown summary for "For You"
  groundingSources?: Array<{ title: string; uri: string }>;
}
