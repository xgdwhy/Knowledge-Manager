// portal/src/App.tsx
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";

function App() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default App;
