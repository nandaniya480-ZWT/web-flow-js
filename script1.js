let utmParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "rwg_token",
    "merchant_id",
    "provider_id",
    "pcrit",
    "impacttest",
    "im_ref",
    "irpid",
    "irgwc"
];
let currenturlParams = new URLSearchParams(window.location.search);

// Store UTM parameters in localStorage
utmParams.forEach((param) => {
    const value = currenturlParams.get(param);
    if (value) {
        localStorage.setItem(param, value);
    }
});

// Add UTM parameters to links
function addUtmParamsInLinks() {
    const currentDomain = new URL(window.location.href);
    document.querySelectorAll('a[href]').forEach(link => {
        try {
            const href = link.getAttribute('href');
            let updatedUrl;

            if (href.startsWith("/")) {
                updatedUrl = new URL(href, window.location.origin);
            } else if (href.startsWith("http")) {
                const tempUrl = new URL(href);
                if (!tempUrl.hostname.endsWith(".faynutrition.com") && tempUrl.hostname !== "faynutrition.com") return;
                updatedUrl = tempUrl;
            } else {
                return; // skip links like mailto:, tel:, etc.
            }

            const searchParams = new URLSearchParams(updatedUrl.search);
            utmParams.forEach(key => {
                const storedVal = localStorage.getItem(key);
                if (storedVal) {
                    searchParams.set(key, storedVal);
                }
            });

            updatedUrl.search = searchParams.toString();
            link.href = updatedUrl.toString();
        } catch (err) {
            console.warn("Invalid link:", link.href);
        }
    });
}

// Initialize Finsweet CMS
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
    "cmsload",
    (listInstances) => {
        setTimeout(() => {
            addUtmParamsInLinks();
        }, 1000);
    },
]);

// Add UTM parameters on page load
document.addEventListener("DOMContentLoaded", function () {
    addUtmParamsInLinks();
});
