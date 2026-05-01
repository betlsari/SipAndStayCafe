import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack)
    }

    handleReset = () => this.setState({ hasError: false, error: null })

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">
                            ⚠️
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Bir şeyler ters gitti</h2>
                            <p className="text-zinc-500 text-sm mt-1">
                                Beklenmedik bir hata oluştu. Sayfayı yenilemeyi deneyin.
                            </p>
                            {this.state.error && (
                                <p className="text-red-400 text-xs mt-3 font-mono bg-red-500/10 rounded-lg px-3 py-2 break-all">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                            >
                                Tekrar Dene
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                            >
                                Sayfayı Yenile
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}