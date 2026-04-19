// portal/src/components/SearchBar.tsx
import { useState } from "react";
import { searchService, SearchDocument } from "../services/search";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const result = await searchService.search(q);
      setResults(result.hits);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "wiki":
        return "📄";
      case "code":
        return "💻";
      case "task":
        return "📋";
      case "file":
        return "📁";
      default:
        return "📄";
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="搜索知识、代码、任务、文件..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {loading && <span className="search-loading">搜索中...</span>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((doc) => (
            <a key={doc.id} href={doc.url} className="search-result-item">
              <span className="result-icon">{getTypeIcon(doc.type)}</span>
              <div className="result-content">
                <div className="result-title">{doc.title}</div>
                <div className="result-meta">
                  <span>{doc.project}</span>
                  <span>{doc.author}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
