export function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Yükleniyor…</p>
            </div>
        </div>
    )
}