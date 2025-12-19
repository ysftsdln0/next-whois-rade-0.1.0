'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-[#34495E] mb-3">Bir Hata Oluştu</h1>
                    <p className="text-gray-600 mb-8">
                        Üzgünüz, bir şeyler yanlış gitti. Lütfen tekrar deneyin.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-[#34495E] text-white rounded-xl hover:bg-[#2c3e50] transition-colors font-medium"
                    >
                        Tekrar Dene
                    </button>
                    <a
                        href="/"
                        className="px-6 py-3 bg-gray-100 text-[#34495E] rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        Ana Sayfaya Dön
                    </a>
                </div>

                {process.env.NODE_ENV === 'development' && error.message && (
                    <div className="mt-8 p-4 bg-red-50 rounded-lg text-left">
                        <p className="text-xs text-red-600 font-mono break-all">{error.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
