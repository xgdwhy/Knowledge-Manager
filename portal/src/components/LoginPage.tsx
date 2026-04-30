// portal/src/components/LoginPage.tsx
import { useState } from "react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-illustration">
          <div className="illustration-content">
            <div className="illustration-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>企业知识管理平台</h2>
            <p>统一知识池 · 全生命周期追溯 · 跨项目复用</p>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>知识库</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💻</span>
                <span>代码托管</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>任务管理</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔬</span>
                <span>试验数据</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-form-container">
            <div className="login-header">
              <h1>欢迎回来</h1>
              <p>登录以访问您的知识管理工作空间</p>
            </div>

            <div className="login-form">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="login-submit-btn"
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    使用 SSO 登录
                  </>
                )}
              </button>

              <div className="login-divider">
                <span>通过 Keycloak 统一认证</span>
              </div>
            </div>

            <div className="login-footer">
              <p>首次使用？请联系管理员开通账号</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
