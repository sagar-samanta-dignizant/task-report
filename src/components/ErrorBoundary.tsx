import React from "react";

interface Props {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 24, maxWidth: 720, margin: "40px auto", color: "#eee", fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#f56a00" }}>Something went wrong.</h2>
          <p style={{ color: "#ccc" }}>
            The app hit an unexpected error. Reload the page to continue — your saved reports are safe.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff7b7b", fontSize: 12 }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => {
              this.reset();
              window.location.reload();
            }}
            style={{ padding: "6px 14px", marginTop: 10, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
