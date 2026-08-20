import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Catalog ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh w-full flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: '#000000', color: '#A0A5AD' }}>
          <p className="text-sm mb-2">Something went wrong.</p>
          <p className="text-xs opacity-60">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: '#3A301A', color: '#C5A059' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
