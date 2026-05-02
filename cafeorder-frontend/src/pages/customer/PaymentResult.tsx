import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PaymentResult() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const status = searchParams.get('status')
    const method = searchParams.get('method')

    const isCashier = method === 'cashier'
    const isSessionClosed = status === 'session-closed'
    const isSuccess = isCashier || status === 'success'

    // Session zaten kapatılmış
    if (isSessionClosed) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
                <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl">
                        ✓
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-gray-800">Hesap Zaten Kapatıldı</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Bu oturum için ödeme zaten alınmış. Teşekkürler, afiyet olsun!
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Tamam
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
            <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm flex flex-col items-center gap-5">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${isSuccess ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {isSuccess ? '✓' : '✕'}
                </div>

                <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-800">
                        {isSuccess
                            ? isCashier
                                ? 'Bildirim Gönderildi'
                                : 'Ödeme Başarılı'
                            : 'Ödeme Başarısız'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        {isSuccess
                            ? isCashier
                                ? 'Kasiyere bildirim iletildi. Lütfen kasaya gidiniz.'
                                : 'Ödemeniz başarıyla tamamlandı. Afiyet olsun!'
                            : 'Ödeme işlemi gerçekleştirilemedi. Lütfen tekrar deneyin.'}
                    </p>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className={`w-full font-semibold py-3 rounded-xl transition-colors text-white ${isSuccess
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                >
                    {isSuccess ? 'Tamam' : 'Geri Dön'}
                </button>
            </div>
        </div>
    )
}