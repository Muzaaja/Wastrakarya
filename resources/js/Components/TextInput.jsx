import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        variant = 'default',
        ...props
    },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const baseClasses =
        variant === 'underlined'
            ? 'w-full rounded-none border-0 border-b-2 border-primary/50 bg-transparent px-1 py-2 text-white placeholder-white/30 shadow-none transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-0 hover:border-primary/80 '
            : 'rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ';

    return (
        <input
            {...props}
            type={type}
            className={`${baseClasses}${className}`}
            ref={localRef}
        />
    );
});
