declare global {
  interface PagefindSearchResult {
    id: string;
    data: () => Promise<unknown>;
  }

  interface PagefindSearchResponse {
    results: PagefindSearchResult[];
    timings?: {
      preload?: number;
      search?: number;
      total?: number;
    };
  }

  interface Pagefind {
    init: () => Promise<void>;
    search: (query: string) => Promise<PagefindSearchResponse>;
  }

  interface Window {
    pagefind?: Pagefind;
    __pagefindLoaded?: boolean;
  }
}

export {};
