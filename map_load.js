(function () {
    // Dynamically load Mapbox CSS
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css";
    document.head.appendChild(link);

    // Dynamically load Mapbox JS
    var mapboxScript = document.createElement("script");
    mapboxScript.src = "https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js";

    // Once Mapbox JS is loaded, proceed with your custom logic
    mapboxScript.onload = function () {
        const header = document.querySelector("#header");
        const menuButton = document.querySelector(".nav__menu-button");
        const headerBg = document.querySelector(".header__bg");
        const backLinks = document.querySelectorAll(".nav_back-link");
        const dropdowns = document.querySelectorAll(".nav__dd");

        let isMenuOpen = false;
        let lastScrollTop = 0;
        let hasClickedForScrollUp = false;

        // Scroll: header .scroll toggle
        window.addEventListener("scroll", () => {
            const scroll = window.scrollY || document.documentElement.scrollTop;

            // toggle .scroll
            if (scroll > 0) {
                header.classList.add("scroll");
            } else {
                header.classList.remove("scroll");
            }

            // scroll-up logic
            if (scroll > lastScrollTop) {
                header.classList.add("scroll-up");

                // auto-close menu on scroll down
                if (!hasClickedForScrollUp && isMenuOpen) {
                    menuButton.click();
                    hasClickedForScrollUp = true;
                }
            } else {
                header.classList.remove("scroll-up");
                hasClickedForScrollUp = false;
            }

            lastScrollTop = scroll <= 0 ? 0 : scroll;
        });

        // Menu button toggle
        if (menuButton) {
            menuButton.addEventListener("click", () => {
                isMenuOpen = !isMenuOpen;
                headerBg.classList.toggle("is-open", isMenuOpen);
            });
        }

        // Back links inside dropdown
        backLinks.forEach((link) => {
            link.addEventListener("click", () => {
                setTimeout(() => {
                    document.querySelectorAll(".nav__dd.show").forEach((dd) => {
                        dd.classList.remove("show");
                    });
                }, 10);
            });
        });

        // Dropdown handlers
        function handleDesktop(dropdown) {
            dropdown.addEventListener("mouseenter", () => {
                if (window.innerWidth >= 992) {
                    dropdown.classList.add("show");
                }
            });
            dropdown.addEventListener("mouseleave", () => {
                if (window.innerWidth >= 992) {
                    dropdown.classList.remove("show");
                }
            });
        }

        function handleMobile(dropdown) {
            const trigger = dropdown.querySelector(".nav__dd-trigger");
            if (!trigger) return;

            trigger.addEventListener("click", (e) => {
                if (window.innerWidth < 992) {
                    e.preventDefault();
                    dropdown.classList.toggle("show");
                }
            });
        }

        dropdowns.forEach((dropdown) => {
            handleDesktop(dropdown);
            handleMobile(dropdown);
        });

        document.addEventListener("click", (e) => {
            dropdowns.forEach((dropdown) => {
                if (
                    window.innerWidth < 992 &&
                    !dropdown.contains(e.target) &&
                    !e.target.classList.contains("nav__dd-trigger")
                ) {
                    dropdown.classList.remove("show");
                }
            });
        });

        window.addEventListener("resize", () => {
            dropdowns.forEach((dropdown) => {
                dropdown.classList.remove("show");
            });
        });

        const titleWrapper = document.querySelector(".map-filter_title-wr");
        const mainContent = document.querySelector(".map-filter_main");
        const filterApplyButton = document.getElementById("filterApply");

        let isOverflowVisible = false; // State to track overflow visibility for .map-filter_main
        let toggleTimeoutId = null; // Variable to store the timeout ID for the overflow toggle

        // Function to check if the device is considered "mobile" based on screen width
        const isMobileScreen = () => window.innerWidth < 479;

        // --- Logic for .map-filter_title-wr click to toggle overflow ---
        titleWrapper.addEventListener("click", () => {
            if (isMobileScreen()) {
                if (!isOverflowVisible) {
                    // First click: toggle to visible with a delay
                    // Clear any existing timeout to prevent multiple delayed actions
                    if (toggleTimeoutId) {
                        clearTimeout(toggleTimeoutId);
                    }
                    toggleTimeoutId = setTimeout(() => {
                        mainContent.style.overflow = "visible";
                        isOverflowVisible = true;
                        toggleTimeoutId = null;
                    }, 300);
                } else {
                    // Second click: instantly set to hidden
                    // Ensure any pending 'visible' timeout is cleared if user clicks again quickly
                    if (toggleTimeoutId) {
                        clearTimeout(toggleTimeoutId);
                        toggleTimeoutId = null;
                    }
                    mainContent.style.overflow = "hidden";
                    isOverflowVisible = false;
                }
            }
        });

        // --- Logic for #filterApply click to trigger .map-filter_title-wr click ---
        if (filterApplyButton && titleWrapper) {
            // Ensure both elements exist
            filterApplyButton.addEventListener("click", () => {
                // Only trigger the click if on a mobile screen
                if (isMobileScreen()) {
                    // Programmatically trigger a click event on .map-filter_title-wr
                    titleWrapper.click();
                }
            });
        } else {
            console.error(
                "Error: Could not find #filterApply or .map-filter_title-wr elements for filter apply logic."
            );
        }

        // --- Responsive resize listener ---
        window.addEventListener("resize", () => {
            if (!isMobileScreen()) {
                // If resized to desktop, ensure overflow is visible and reset state
                if (mainContent.style.overflow !== "visible") {
                    mainContent.style.overflow = "visible";
                }
                if (toggleTimeoutId) {
                    // Clear any pending timeout if desktop size
                    clearTimeout(toggleTimeoutId);
                    toggleTimeoutId = null;
                }
                isOverflowVisible = false; // Reset state for future mobile checks
            } else {
                // If resized to mobile
                // If currently visible and it shouldn't be (i.e., not from a deliberate first click)
                if (mainContent.style.overflow === "visible" && !isOverflowVisible) {
                    mainContent.style.overflow = "hidden";
                }
            }
        });
        // Initial check on load in case the page loads directly on a small screen
        // or if the initial state needs to be forced for desktop.
        if (!isMobileScreen()) {
            mainContent.style.overflow = "visible";
        } else {
            // On mobile, ensure it's hidden initially if not already in that state
            mainContent.style.overflow = "hidden";
        }
        const urlParams = new URLSearchParams(window.location.search);
        const region = urlParams.get("region");
        const state = urlParams.get("state");
        const segment = urlParams.get("segment");
        const openPopupParam = urlParams.get("openpopup");

        let locations = [];
        let bounds = [];
        const mapboxAccessToken =
            "pk.eyJ1Ijoia3Jpc3RlbmF0ZmxvY2siLCJhIjoiY21iamQ3ZnpyMGVvNTJub29vNDUydHd0MSJ9.KOVQYg0oXDerDHlVqQoBBg";

        // const dataBaseUrl = "http://192.168.1.33:3002/api/v1/locations";
        const dataBaseUrl =
            "https://cdn.prod.website-files.com/683ea9ecd5e30a9e0614e96e/68510a25934e28a74066a147_data.txt";
        /* const usaBounds = [
                [-125.0011, 24.9493],
                [-66.9326, 49.5904]
            ]; */

        const usaBounds = [
            [-179.231086, 18.7763],
            [-66.93457, 71.5388],
        ];
        let map;
        let openPopupId = null;

        function initializeMapWithClusters() {
            return new Promise((resolve, reject) => {
                const query = new URLSearchParams(window.location.search);

                closePopup();
                mapboxgl.accessToken = mapboxAccessToken;

                map = new mapboxgl.Map({
                    container: "map-canvas",
                    style: "mapbox://styles/mapbox/light-v11",
                    projection: "mercator",
                    center: [-98.5795, 39.8283],
                    zoom: 4,
                    maxBounds: usaBounds,
                });

                map.on("load", () => {
                    const placeLabelLayers = [
                        "state-label",
                        "country-label",
                        "settlement-major-label",
                        "settlement-minor-label",
                    ];
                    placeLabelLayers.forEach((layerId) => {
                        if (map.getLayer(layerId)) {
                            map.setPaintProperty(layerId, "text-opacity", 1);
                            map.setPaintProperty(layerId, "text-color", "#828383");
                        }
                    });

                    // Load highlight-pointer icon
                    if (!map.hasImage("highlight-pointer")) {
                        map.loadImage(
                            "https://cdn.prod.website-files.com/683ea9ecd5e30a9e0614e96e/68510c2f72287d777570f27a_bb2f04bf3fcabe378868347aeeb9c181_marker-open.png",
                            (error, image) => {
                                if (error) {
                                    reject(error);
                                    return;
                                }

                                // Double-check inside the callback
                                if (!map.hasImage("highlight-pointer")) {
                                    map.addImage("highlight-pointer", image);
                                }
                            }
                        );
                    }

                    // Fetch and process location data
                    fetch(`${dataBaseUrl}${query ? "?" + query : ""}`)
                        .then((res) => res.json())
                        .then(({ data }) => {
                            locations = data.locations || [];

                            if (locations.length > 0) {
                                /*  const coordinates = locations.map(
                                   (loc) => loc.geometry.coordinates
                                 );
                                 bounds = coordinates.reduce(
                                   (b, c) => b.extend(c),
                                   new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
                                 ); */
                                /*  map.fitBounds(bounds, {
                                   padding: 50,
                                   maxZoom: 10,
                                   duration: 1000,
                                 }); */
                            }

                            const geojsonData = {
                                type: "FeatureCollection",
                                features: locations.map((loc) => ({
                                    type: "Feature",
                                    geometry: {
                                        type: "Point",
                                        coordinates: loc.geometry.coordinates,
                                    },
                                    properties: { ...loc },
                                })),
                            };
                            resolve();
                            map.addSource("locations", {
                                type: "geojson",
                                data: geojsonData,
                                cluster: true,
                                clusterMaxZoom: 10,
                                clusterRadius: 50,
                            });

                            map.addSource("highlight-point", {
                                type: "geojson",
                                data: { type: "FeatureCollection", features: [] },
                            });

                            map.addLayer({
                                id: "cluster-background",
                                type: "circle",
                                source: "locations",
                                filter: ["has", "point_count"],
                                paint: {
                                    "circle-color": "#fff",
                                    "circle-radius": 22,
                                    "circle-stroke-width": 2,
                                    "circle-stroke-color": "#000",
                                },
                            });

                            map.addLayer({
                                id: "clusters",
                                type: "circle",
                                source: "locations",
                                filter: ["has", "point_count"],
                                paint: {
                                    "circle-color": "#3fc919",
                                    "circle-radius": 22,
                                    "circle-stroke-width": 3,
                                    "circle-stroke-color": "#fff",
                                },
                            });

                            map.addLayer({
                                id: "cluster-count",
                                type: "symbol",
                                source: "locations",
                                filter: ["has", "point_count"],
                                layout: {
                                    "text-field": [
                                        "case",
                                        [">", ["get", "point_count"], 99],
                                        "99+",
                                        ["get", "point_count_abbreviated"],
                                    ],
                                    "text-size": 20,
                                    "text-allow-overlap": true,
                                    "text-ignore-placement": true,
                                    "text-anchor": "center",
                                },
                                paint: { "text-color": "#000" },
                            });

                            map.addLayer({
                                id: "unclustered-point",
                                type: "circle",
                                source: "locations",
                                filter: ["!", ["has", "point_count"]],
                                paint: {
                                    "circle-color": "#3fc919",
                                    "circle-radius": 12,
                                    "circle-stroke-width": 2,
                                    "circle-stroke-color": "#fff",
                                },
                            });

                            map.addLayer({
                                id: "highlight-symbol",
                                type: "symbol",
                                source: "highlight-point",
                                layout: {
                                    "icon-image": "highlight-pointer",
                                    "icon-size": 1,
                                    "icon-allow-overlap": true,
                                    "icon-ignore-placement": true,
                                },
                            });

                            map.moveLayer("highlight-symbol");

                            map.on("click", "unclustered-point", (e) => {
                                const props = e.features[0].properties;
                                const coords = e.features[0].geometry.coordinates;
                                openPopupId = props.id;

                                const canvas = map.getCanvas();
                                const point = map.project(coords);
                                const width = window.innerWidth;
                                let zoomLevel = map.getZoom();

                                const { center, zoom } = calculateResponsiveOffset(coords, 7);

                                const offsetLngLat = map.unproject(point);

                                map.flyTo({
                                    center: center,
                                    zoom: zoom,
                                    speed: 0.5,
                                    curve: 1.4,
                                    essential: true,
                                });

                                map.getSource("highlight-point").setData({
                                    type: "FeatureCollection",
                                    features: [
                                        {
                                            type: "Feature",
                                            geometry: { type: "Point", coordinates: coords },
                                            properties: {},
                                        },
                                    ],
                                });

                                populatePopup(props);
                            });

                            map.on("click", (e) => {
                                const features = map.queryRenderedFeatures(e.point, {
                                    layers: ["unclustered-point"],
                                });

                                if (!features.length) {
                                    closePopup();
                                    map.getSource("highlight-point").setData({
                                        type: "FeatureCollection",
                                        features: [],
                                    });
                                }
                            });

                            const popup = new mapboxgl.Popup({
                                closeButton: false,
                                closeOnClick: false,
                            });

                            const isTouchDevice =
                                "ontouchstart" in window || navigator.maxTouchPoints > 0;

                            if (!isTouchDevice) {
                                map.on("mouseenter", "unclustered-point", (e) => {
                                    if (openPopupId == e.features[0].properties.id) return;
                                    map.getCanvas().style.cursor = "pointer";

                                    const coordinates =
                                        e.features[0].geometry.coordinates.slice();
                                    const title = e.features[0].properties.title;
                                    const description = e.features[0].properties.description;

                                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                                        coordinates[0] +=
                                            e.lngLat.lng > coordinates[0] ? 360 : -360;
                                    }

                                    const popupHTML = `
                                <div style="max-width: 400px;">
                                    <h6 style="margin: 0 0 5px;">${title}</h6>
                                    <p style="margin: 0 ; font-size: 14px">${description}</p>
                                </div>
                            `;

                                    popup.setLngLat(coordinates).setHTML(popupHTML).addTo(map);
                                });

                                map.on("mouseleave", "unclustered-point", () => {
                                    map.getCanvas().style.cursor = "";
                                    popup.remove();
                                });
                            }

                            if (isTouchDevice) {
                                map.on("touchstart", "unclustered-point", (e) => {
                                    if (openPopupId === e.features[0].properties.id) return;

                                    const coordinates =
                                        e.features[0].geometry.coordinates.slice();
                                    const title = e.features[0].properties.title;
                                    const description = e.features[0].properties.description;

                                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                                        coordinates[0] +=
                                            e.lngLat.lng > coordinates[0] ? 360 : -360;
                                    }

                                    const popupHTML = `
                                <div style="max-width: 400px;">
                                    <h6 style="margin: 0 0 5px;">${title}</h6>
                                    <p style="margin: 0 ; font-size: 14px;">${description}</p>
                                </div>
                            `;

                                    popup.setLngLat(coordinates).setHTML(popupHTML).addTo(map);
                                    openPopupId = e.features[0].properties.id;
                                });

                                map.on("touchstart", (e) => {
                                    const features = map.queryRenderedFeatures(e.point, {
                                        layers: ["unclustered-point"],
                                    });

                                    if (!features.length) {
                                        popup.remove();
                                        openPopupId = null;
                                    }
                                });
                            }
                        })
                        .catch((err) => {
                            console.error("Failed to load map data", err);
                            reject(err);
                        });
                });
            });
        }

        const populatePopup = (props) => {
            document.querySelector(
                ".ts-p--big"
            ).textContent = `Solved Story #${props.sr_no}`;
            document.querySelector(".ts-h6.tc-white").textContent = props.title;
            document.querySelector(".tc-grey200").textContent = props.description;
            document.getElementById("popup-address").textContent = props.address;

            const articleLink = document
                .querySelector(".icon-link.w-inline-block")
                .setAttribute("data-sr", props.sr_no);

            const tagContainer = document.querySelector(".map-popup_tags-wrapper");
            tagContainer.innerHTML = "";

            let tags = [];

            try {
                if (Array.isArray(props.segments)) {
                    // Already decoded
                    tags = props.segments;
                } else if (typeof props.segments === "string") {
                    // Try to parse JSON string
                    const parsed = JSON.parse(props.segments);
                    if (Array.isArray(parsed)) {
                        tags = parsed;
                    } else {
                        // Fallback: treat string as comma-separated values
                        tags = props.segments.split(",");
                    }
                }
            } catch (err) {
                console.warn(
                    "Error parsing segments, using as comma-separated string:",
                    err
                );
                tags = props.segments.split(",");
            }

            tags.forEach((tag) => {
                const div = document.createElement("div");
                div.className = "map-popup_tag";
                div.textContent = tag.trim();
                tagContainer.appendChild(div);
            });

            const el = document.querySelector(".map-popup_bottom .w-inline-block");
            if (el) el.href = props.article_url || "#";

            const shareLink = document.querySelector(
                ".map-popup_bottom .map-popup_share"
            );

            if (shareLink) {
                const url = new URL(window.location.href);
                url.searchParams.set("openpopup", props.sr_no);

                const shareUrl = url.toString();

                shareLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    console.log('Testing')
                    navigator.clipboard
                        .writeText(shareUrl)
                        .then(() => {
                            // Change background color to green
                            shareLink.style.backgroundColor = "#3fc919";
                            shareLink.style.color = "white";

                            // Revert after 2 seconds
                            setTimeout(() => {
                                shareLink.style.backgroundColor = "";
                                shareLink.style.color = "";
                            }, 2000);
                        })
                        .catch((err) => {
                            console.error("Failed to copy: ", err);
                        });
                });
            }

            if (window.innerWidth < 992) {
                if ($('.map-filter_close').height == 0) {
                    $('.map-filter_close').trigger('click')
                }
                if ($('.map-filter_main').height == 0) {
                    $('.map-filter_title-icon').trigger('click')
                }
            }

            document
                .getElementsByClassName("map-canvas_popup")[0]
                .classList.remove("hide");
        };

        const closePopup = () => {
            openPopupId = null;
            document
                .getElementsByClassName("map-canvas_popup")[0]
                .classList.add("hide");
        };

        document.querySelectorAll(".icon-link.w-inline-block").forEach((el) => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                const targetId = el.getAttribute("data-sr");
                const target = locations.find((loc) => loc.sr_no == targetId);
                if (!target) return;

                closePopup();

                const coords = target.geometry.coordinates;
                openPopupId = target.id;
                const point = map.project(coords);
                let zoomLevel = map.getZoom();
                const offsetLngLat = map.unproject(point);
                map.flyTo({
                    center: coords,
                    zoom: zoomLevel,
                    speed: 0.5,
                    curve: 1.4,
                    essential: true,
                });

                map.getSource("highlight-point").setData({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: { type: "Point", coordinates: coords },
                            properties: {},
                        },
                    ],
                });
            });
        });

        // Map controller buttons
        document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
        document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());
        document.getElementById("locate-me-btn").addEventListener("click", () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lng = position.coords.longitude;
                    const lat = position.coords.latitude;

                    map.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        speed: 0.5,
                        curve: 1.4,
                        essential: true,
                    });

                    new mapboxgl.Marker({ color: "#007aff" })
                        .setLngLat([lng, lat])
                        .addTo(map);
                },
                (error) => {
                    alert("Unable to retrieve your location.");
                    console.error(error);
                }
            );
        });

        // Clear state param
        $('[fs-combobox-element="clear"]').on("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.delete("state");
            history.replaceState({}, "", url);
            initializeMapWithClusters();
        });

        // Copy current URL
        $(".map-filter_right .button.is-secondary.is-nav.is-white").on(
            "click",
            function (e) {
                e.preventDefault();
                const currentUrl = window.location.href;
                const textarea = document.createElement("textarea");
                textarea.value = currentUrl;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();

                const buttonText = $(this).find("div");
                const originalText = buttonText.text();

                try {
                    const successful = document.execCommand("copy");
                    if (successful) {
                        buttonText.text("Copied!");
                        setTimeout(() => buttonText.text(originalText), 2000);
                    }
                } catch (err) {
                    console.error("Failed to copy: ", err);
                }

                document.body.removeChild(textarea);
            }
        );

        // Popup close
        $(".map-popup_close").on("click", () => {
            closePopup();
            if (map?.getSource("highlight-point")) {
                map.getSource("highlight-point").setData({
                    type: "FeatureCollection",
                    features: [],
                });
            }
        });

        // Prevent form submit on enter
        $("#States-Search").on("keydown", (e) => {
            if (e.key === "Enter") e.preventDefault();
        });

        // Load filters from URL
        if (region) {
            $("#Region").prop("checked", true).trigger("change");
            showRegion(region);
        } else if (state) {
            $("#State").prop("checked", true).trigger("change");
            showState(state);
        } else {
            showRegion();
        }

        if (segment) {
            $("#Segments").val(segment).trigger("change");
        }

        // Filter controls
        $("#State, #Region").on("change", function () {
            const selected = this.value;

            if (selected === "Region") {
                showRegion();
                updateURLParam("state", "");
                $("#States").val("All States");
                $("#fs-option-all-states")[0].click();
                initializeMapWithClusters();
            } else if (selected === "State") {
                showState("");
                updateURLParam("region", "");
                $("#Regions").val("All Regions").trigger("change");
                $(".map-filter_dd-link")[0].click();
            }
        });

        $("#Regions").on("change", function () {
            updateURLParam(
                "region",
                this.value === "All Regions" ? "" : this.value.trim()
            );
            initializeMapWithClusters();
        });

        $("#States").on("change", function () {
            updateURLParam(
                "state",
                this.value === "All States" ? "" : this.value.trim()
            );
            initializeMapWithClusters();
        });

        $("#Segments").on("change", function () {
            updateURLParam(
                "segment",
                this.value === "All Segments" ? "" : this.value.trim()
            );
            initializeMapWithClusters().then(() => { });
        });

        function showRegion(selectedValue = null) {
            $('[map-filter="Regions"]').show();
            $('[map-filter="States"]').hide();
            if (selectedValue) {
                $("#Regions").val(selectedValue).trigger("change");
            }
        }

        function showState(selectedValue = null) {
            $('[map-filter="States"]').show();
            $('[map-filter="Regions"]').hide();

            if (selectedValue) {
                setTimeout(() => {
                    let states = $(".map-filter_dd-list")[1].children;
                    $.each(states, (key, item) => {
                        if ($(item).is("a") && selectedValue === $(item).text().trim()) {
                            $(".map-filter_input").val(selectedValue);
                            $(item).attr("aria-selected", true);
                            $(item).addClass("w--current");
                            $(item).attr("tabindex", 0);
                        }
                    });
                }, 500);
            }
        }

        function updateURLParam(key, value) {
            const params = new URLSearchParams(window.location.search);
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            history.replaceState(
                null,
                "",
                `${window.location.pathname}?${params.toString()}`
            );
        }
        initializeMapWithClusters().then(() => {
            if (openPopupParam) {
                updateURLParam("openpopup", "");
                const srNo = parseInt(openPopupParam);
                const target = locations.find((loc) => loc.sr_no == srNo);
                if (target) {
                    const coords = target.geometry.coordinates;
                    openPopupId = target.id;

                    const point = map.project(coords);
                    const { center, zoom } = calculateResponsiveOffset(coords, 7);
                    const offsetLngLat = map.unproject(point);
                    map.flyTo({
                        center: center,
                        zoom: zoom,
                        speed: 0.5,
                        curve: 1.4,
                        essential: true,
                    });

                    map.getSource("highlight-point").setData({
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: { type: "Point", coordinates: coords },
                                properties: {},
                            },
                        ],
                    });

                    setTimeout(() => {
                        populatePopup(target);
                    }, 1000);
                }
            }
        });
        function calculateResponsiveOffset(targetCoords, zoomLevel) {
            const width = window.innerWidth;
            const canvas = map.getCanvas();

            const originalCenter = map.getCenter();
            const originalZoom = map.getZoom();

            map.jumpTo({
                center: targetCoords,
                zoom: zoomLevel
            });

            const targetPoint = map.project(targetCoords);

            let offsetX = 0;
            let offsetY = 0;

            if (width <= 479) {
                offsetY = canvas.height * 0.25 - targetPoint.y;
            } else if (width < 992) {
                offsetX = canvas.width / 2.40 - targetPoint.x;
            } else {
                offsetX = canvas.width / 2.40 - targetPoint.x;
            }

            const offsetPoint = [targetPoint.x + offsetX, targetPoint.y + offsetY];
            const offsetCenter = map.unproject(offsetPoint);

            map.jumpTo({
                center: originalCenter,
                zoom: originalZoom
            });
            map.flyTo({
                center: [offsetCenter.lng, offsetCenter.lat],
                zoom: zoomLevel,
                speed: 0.5,
                curve: 1.4,
                essential: true
            });

            return {
                center: [offsetCenter.lng, offsetCenter.lat],
                zoom: zoomLevel
            };
        }
    };
    // Append the Mapbox script to the document
    document.head.appendChild(mapboxScript);
})();