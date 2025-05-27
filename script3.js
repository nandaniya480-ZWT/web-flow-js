// Manage rel=canonical for pagination and search queries
document.addEventListener("DOMContentLoaded", function () {

    // Function to remove query parameters from URL
    function removeQueryString(url) {
        return url.split("?")[0];
    }

    // Function to get the value of a query parameter by name
    function getQueryParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // Function to build the canonical URL with search query parameters
    function buildCanonicalUrl() {
        const baseUrl = "https://www.faynutrition.com/find";
        const queryParams = ["state", "specialty", "insurance", "modality"];
        let queryString = "";

        queryParams.forEach((param) => {
            const value = getQueryParameterByName(param);
            if (value) {
                queryString += `${queryString ? "&" : "?"
                    }${param}=${encodeURIComponent(value)}`;
            }
        });

        // Handle pagination separately to append it at the end of the query string
        const paginationParam = "e504febf_page";
        const pageNumber = parseInt(getQueryParameterByName(paginationParam));
        if (pageNumber && pageNumber > 1) {
            queryString += `${queryString ? "&" : "?"
                }${paginationParam}=${pageNumber}`;
        }

        return baseUrl + queryString;
    }

    // Check for existing canonical URL and warn if found
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
        console.warn("Found existing canonical URL:", existingCanonical.href);
        existingCanonical.parentNode.removeChild(existingCanonical);
    }

    // Generate the canonical URL
    const canonicalUrl = buildCanonicalUrl();

    // Create and insert canonical link element
    const canonicalLink = document.createElement("link");
    canonicalLink.rel = "canonical";
    canonicalLink.href = canonicalUrl;
    document.head.appendChild(canonicalLink);
});