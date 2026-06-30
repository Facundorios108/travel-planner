import { useEffect } from 'react';

export function useLockBodyScroll(isLocked: boolean) {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
            // Also add padding right to prevent layout shift on desktop
            document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isLocked]);
}
