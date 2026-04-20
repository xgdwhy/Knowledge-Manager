// portal/src/App.tsx
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import Dashboard from "./components/Dashboard";

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  // 未登录时也显示 Header 和 Dashboard
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default App;
