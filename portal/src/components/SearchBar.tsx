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

  const handleBlur = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  const handleFocus = () => {
    if (query.length >= 2) {
      setShowResults(true);
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
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="搜索知识、代码、任务、文件..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="search-input"
          aria-label="全局搜索"
        />
        {loading && <span className="search-loading"><span className="loading-spinner"></span></span>}
      </div>

      {showResults && (
        <div className="search-results" role="listbox">
          {results.length > 0 ? (
            results.map((doc) => (
              <a key={doc.id} href={doc.url} className="search-result-item" role="option">
                <span className="result-icon">{getTypeIcon(doc.type)}</span>
                <div className="result-content">
                  <div className="result-title">{doc.title}</div>
                  <div className="result-meta">
                    <span>{doc.project}</span>
                    <span>·</span>
                    <span>{doc.author}</span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="search-empty">
              <p>未找到相关结果</p>
              <span>尝试其他关键词</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
