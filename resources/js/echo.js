import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const getCsrfToken = () => {
    const match = document.cookie.match(/(?:^|; )\s*XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

export const getEcho = () => {
    if (typeof window === 'undefined') return null;
    if (window.Echo) return window.Echo;

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    if (!reverbKey) {
        console.warn('VITE_REVERB_APP_KEY is not defined in environment.');
        return null;
    }

    const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const port = import.meta.env.VITE_REVERB_PORT || 8080;
    const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
    const isTls = scheme === 'https';

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: isTls,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
        },
    });

    return window.Echo;
};

export default getEcho;
