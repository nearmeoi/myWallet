import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import '@fontsource/outfit/300.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { DebtProvider } from './context/DebtContext';
import { SavingsProvider } from './context/SavingsContext';
import { setupPreventZoom } from './lib/preventZoom';

// Prevent iOS Safari pinch-to-zoom and unwanted gesture zooming
setupPreventZoom();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
          <h2>Something went wrong.</h2>
          <p>Please report this error:</p>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <WalletProvider>
          <DebtProvider>
            <SavingsProvider>
              <App />
            </SavingsProvider>
          </DebtProvider>
        </WalletProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)