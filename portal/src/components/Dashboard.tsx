// portal/src/components/Dashboard.tsx
import SearchBar from "./SearchBar";

interface DashboardCard {
  title: string;
  count: number;
  href: string;
  icon: string;
  description: string;
}

export default function Dashboard() {
  const cards: DashboardCard[] = [
    {
      title: "知识库",
      count: 128,
      href: "/wiki/",
      icon: "📚",
      description: "文档与知识条目",
    },
    {
      title: "代码仓库",
      count: 45,
      href: "/code/",
      icon: "💻",
      description: "源代码与制品",
    },
    {
      title: "任务看板",
      count: 23,
      href: "/tasks/",
      icon: "📋",
      description: "项目任务追踪",
    },
    {
      title: "试验数据",
      count: 56,
      href: "/data/",
      icon: "🔬",
      description: "视频与报告存储",
    },
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <section className="dashboard-header">
          <h1>企业知识管理平台</h1>
          <p>统一知识池 · 全生命周期追溯 · 跨项目复用</p>
        </section>

        <div className="search-section">
          <SearchBar />
        </div>

        <section className="cards-section">
          <h2 className="section-title">快速访问</h2>
          <div className="cards-grid">
            {cards.map((card) => (
              <a key={card.href} href={card.href} className="dashboard-card">
                <div className="card-icon">{card.icon}</div>
                <div className="card-content">
                  <div className="card-title">{card.title}</div>
                  <div className="card-description">{card.description}</div>
                </div>
                <div className="card-count">{card.count}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="quick-actions">
          <h2 className="section-title">快捷操作</h2>
          <div className="actions-grid">
            <a href="/wiki/?do=create" className="action-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>新建文档</span>
            </a>
            <a href="/code/repo/create" className="action-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>创建仓库</span>
            </a>
            <a href="/tasks/projects/create" className="action-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>新建项目</span>
            </a>
            <a href="/data/apps/files/" className="action-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>上传文件</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
