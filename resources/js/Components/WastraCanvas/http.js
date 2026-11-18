export function getCsrfToken() {
    const match = document.cookie.match(/(?:^|; )\s*XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : null;
}

export function getJsonRequestHeaders() {
    const csrfToken = getCsrfToken();

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
    };
}

export function getRequestHeaders() {
    const csrfToken = getCsrfToken();

    return {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
    };
}
