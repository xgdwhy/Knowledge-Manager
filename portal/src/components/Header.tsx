// portal/src/components/Header.tsx
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { isAuthenticated, user, login, logout } = useAuth();

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
          <a href="/">知识管理平台</a>
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
              <span className="user-name">{user?.name}</span>
              <button onClick={logout} className="logout-btn">
                登出
              </button>
            </div>
          ) : (
            <button onClick={login} className="login-btn">
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
