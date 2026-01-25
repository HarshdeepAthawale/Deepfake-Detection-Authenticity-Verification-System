/**
 * Toast Notification Provider
 * Global toast notifications using sonner
 */

'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastProvider() {
    const { theme } = useTheme();

    return (
        <Toaster
            theme={theme as 'light' | 'dark' | 'system'}
            position="top-right"
            expand={false}
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'font-mono text-xs border-primary/20',
                    title: 'text-sm font-bold',
                    description: 'text-xs',
                    actionButton: 'bg-primary text-primary-foreground',
                    cancelButton: 'bg-muted text-muted-foreground',
                    closeButton: 'bg-primary/10 text-primary border-primary/20',
                },
            }}
        />
    );
}

export default ToastProvider;
