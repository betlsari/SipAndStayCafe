export function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm font-medium tracking-wide">Yükleniyor…</p>
        </div>
    )
}