/**
 * Confirmation Dialog Component
 * Reusable confirmation dialog for destructive actions
 */

'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'destructive',
}: ConfirmationDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="font-mono border-primary/20">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-primary uppercase tracking-wider">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-xs">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs uppercase tracking-widest">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            variant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs uppercase tracking-widest'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-widest'
                        }
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmationDialog;
