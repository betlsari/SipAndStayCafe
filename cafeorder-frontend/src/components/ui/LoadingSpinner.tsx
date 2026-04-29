export function LoadingSpinner() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0e0e0e]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-[#c8a96e]" />
                <span className="text-sm text-[#666] tracking-widest uppercase">Yükleniyor</span>
            </div>
        </div>
    )
}