'use client';

export default function NotFound() {
    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="text-8xl font-bold text-[#34495E] mb-4">404</div>
                    <h1 className="text-3xl font-bold text-[#34495E] mb-3">Sayfa Bulunamadı</h1>
                    <p className="text-gray-600 mb-8">
                        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                    </p>
                </div>

                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-[#34495E] text-white rounded-xl hover:bg-[#2c3e50] transition-colors font-medium"
                >
                    Ana Sayfaya Dön
                </a>
            </div>
        </div>
    );
}
