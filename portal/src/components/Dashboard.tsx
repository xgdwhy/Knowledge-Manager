// portal/src/components/Dashboard.tsx
import SearchBar from "./SearchBar";

interface DashboardCard {
  title: string;
  count: number;
  href: string;
  icon: string;
}

export default function Dashboard() {
  const cards: DashboardCard[] = [
    { title: "知识库", count: 128, href: "/wiki/", icon: "📚" },
    { title: "代码仓库", count: 45, href: "/code/", icon: "💻" },
    { title: "任务看板", count: 23, href: "/tasks/", icon: "📋" },
    { title: "试验数据", count: 56, href: "/data/", icon: "🔬" },
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <div className="search-section">
          <SearchBar />
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <a key={card.href} href={card.href} className="dashboard-card">
              <div className="card-icon">{card.icon}</div>
              <div className="card-title">{card.title}</div>
              <div className="card-count">{card.count}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
