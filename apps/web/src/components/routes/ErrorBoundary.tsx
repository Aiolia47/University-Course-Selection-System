import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // TODO: Send error to logging service
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryWrapper
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children || null;
  }
}

interface ErrorBoundaryWrapperProps {
  error?: Error;
  onReset: () => void;
}

const ErrorBoundaryWrapper = ({ error, onReset }: ErrorBoundaryWrapperProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onReset();
    navigate('/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Result
        status="500"
        title="500"
        subTitle="抱歉，页面出现了错误。"
        extra={[
          <Button type="primary" onClick={handleGoHome} key="home">
            返回首页
          </Button>,
          <Button onClick={() => window.location.reload()} key="reload">
            刷新页面
          </Button>,
        ]}
      >
        {process.env.NODE_ENV === 'development' && error && (
          <div style={{
            textAlign: 'left',
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            marginTop: '16px'
          }}>
            <h4>错误详情 (开发模式):</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {error.stack}
            </pre>
          </div>
        )}
      </Result>
    </div>
  );
};

export default ErrorBoundary;