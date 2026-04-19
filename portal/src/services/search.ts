// portal/src/services/search.ts
import { MeiliSearch } from "meilisearch";

export interface SearchDocument {
  id: string;
  type: "wiki" | "code" | "task" | "file";
  source: string;
  project: string;
  title: string;
  content: string;
  tags: string[];
  status: "draft" | "controlled";
  author: string;
  created_at: number;
  updated_at: number;
  url: string;
}

export interface SearchResult {
  hits: SearchDocument[];
  totalHits: number;
  processingTimeMs: number;
  query: string;
}

class SearchService {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: window.location.origin + "/storage/search",
      apiKey: "", // API key 由后端代理注入
    });
  }

  async search(
    query: string,
    filters?: {
      type?: string[];
      project?: string;
      status?: string;
    },
  ): Promise<SearchResult> {
    const index = this.client.index("knowledge");

    const filterArray: string[] = [];
    if (filters?.type?.length) {
      filterArray.push(`type IN [${filters.type.join(", ")}]`);
    }
    if (filters?.project) {
      filterArray.push(`project = "${filters.project}"`);
    }
    if (filters?.status) {
      filterArray.push(`status = "${filters.status}"`);
    }

    const result = await index.search(query, {
      filter: filterArray.length > 0 ? filterArray : undefined,
      limit: 20,
      attributesToHighlight: ["title", "content"],
    });

    return {
      hits: result.hits as SearchDocument[],
      totalHits: result.estimatedTotalHits,
      processingTimeMs: result.processingTimeMs,
      query: result.query,
    };
  }
}

export const searchService = new SearchService();
