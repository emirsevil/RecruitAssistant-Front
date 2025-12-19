"use client";

import { I18nextProvider } from 'react-i18next';
import i18n from '@/src/i18n';
import { ReactNode, useEffect, useState } from 'react';

export default function I18nProvider({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            // Render a simple loading state or just the children structure without translation if possible,
            // but since we wrap the whole app, we might just return null to avoid mismatch.
            // However, returning null creates a layout shift.
            // Since this provider wraps everything in body (in layout.tsx),
            // returning null means empty body body.
            // A meaningful loader is better.
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
