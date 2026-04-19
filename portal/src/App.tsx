// portal/src/App.tsx
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import Dashboard from "./components/Dashboard";

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <h1>知识管理平台</h1>
        <p>请登录以访问系统</p>
      </div>
    );
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default App;
