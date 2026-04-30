// portal/src/components/Header.tsx
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  const navItems = [
    { label: "首页", href: "/" },
    { label: "知识库", href: "/wiki/" },
    { label: "代码", href: "/code/" },
    { label: "任务", href: "/tasks/" },
    { label: "试验数据", href: "/data/" },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <a href="/">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>知识管理平台</span>
          </a>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-item">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="user-area">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="user-name">{user?.name}</span>
              <button onClick={logout} className="logout-btn">
                退出
              </button>
            </div>
          ) : (
            <button className="login-btn">登录</button>
          )}
        </div>
      </div>
    </header>
  );
}
