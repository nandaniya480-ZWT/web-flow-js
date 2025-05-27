addUtmParamsInLinks();


// Popup Management
const nav = document.querySelector(".static-nav");
const triggers = document.querySelectorAll(".popup-trigger");
const popups = document.querySelectorAll(".mobile-filter-modal");
let lastTrigger = null;

// Event Listeners for Popups
triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
        const popupId = event.currentTarget.getAttribute("data-popup");
        const popup = document.getElementById(popupId);
        if (popup) {
            openPopup(popup, trigger);
        }
    });
});

popups.forEach((popup) => {
    const closeButton = popup.querySelectorAll(".close");
    if (closeButton && closeButton.length > 0) {
        closeButton.forEach((button) => {
            button.addEventListener("click", () => closePopup(popup));
        });
    }

    popup.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup(popup);
        }
    });
});

// Popup Functions
function openPopup(popup, trigger) {
    popups.forEach((otherPopup) => {
        if (otherPopup !== popup) {
            otherPopup.classList.remove("is-visible");
            otherPopup.setAttribute("inert", "");
            otherPopup.setAttribute("aria-hidden", "true");
        }
    });

    popup.classList.add("is-visible");
    popup.removeAttribute("inert");
    popup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // nav.style.top = "-4.5rem";

    const focusableElements = popup.querySelectorAll(
        "a, button, input, select, textarea"
    );
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }

    lastTrigger = trigger;
}

function closePopup(popup) {
    popup.classList.remove("is-visible");
    popup.setAttribute("inert", "");
    popup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Return focus to the last trigger
    if (lastTrigger) {
        lastTrigger.focus();
        lastTrigger = null; // Clear after returning focus
    }
}

// Close Popup on Esc Key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        popups.forEach((popup) => {
            if (popup.classList.contains("is-visible")) {
                closePopup(popup);
            }
        });
    }
});

// Location and State Management
const apiKey = "AIzaSyBvoUcGtPBjUewpNhFXpf_r6rue6cyVvnY";
const zipInput = document.getElementById("zip-input");
const zipInputMobile = document.getElementById("zip-input-mobile");
const clearButton = document.getElementById("clear-zip");
const clearState = document.getElementById("clear-state");

function applyStateFilter(state, userLatLong = null) {
    const stateElements = document.querySelectorAll(".count-state");
    for (const stateElement of stateElements) {
        const stateName = stateElement.getAttribute("state-name");
        const radio = stateElement.querySelector(".state-checkbox");
        if (stateName === state) {
            radio.click();
            const statelabel = stateElement.querySelector(".checkbox-label")?.textContent?.trim();
            updateStateParam(stateName, userLatLong);
        } else {
            radio.checked = false;
        }
    }
    addUtmParamsInLinks();
}

function updateStateParam(newValue, userLocation = null) {
    const url = new URL(window.location.href);
    if (newValue && userLocation != null) {
        url.searchParams.set('state', newValue);
        const userLatLong = `${userLocation.lat},${userLocation.lng}`;
        url.searchParams.set('location_coordinates', userLatLong);
    } else {
        url.searchParams.delete('state');
        url.searchParams.delete('location_coordinates');
    }

    window.history.replaceState({}, '', url);
    fetchProviderProfiles();
}

// Google Maps Integration
function initMap() {
    const applyAutocomplete = (inputElement) => {
        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ["(regions)"],
            componentRestrictions: { country: "us" },
        });

        autocomplete.setFields(["address_components", "geometry"]);

        autocomplete.addListener("place_changed", function () {
            const place = autocomplete.getPlace();
            if (place.address_components) {
                let zipCode = null;
                let state = null;
                const userLatLong = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };

                for (const component of place.address_components) {
                    if (component.types.includes("postal_code")) {
                        zipCode = component.short_name;
                    }
                    if (component.types.includes("administrative_area_level_1")) {
                        state = component.short_name;
                    }
                }

                if (zipCode) {
                    setTimeout(() => {
                        checkStateByZipCode(zipCode);
                    }, 300);
                } else if (state) {
                    applyStateFilter(state, userLatLong);
                }
            }

            var event = new Event("input", { bubbles: true });
            inputElement.dispatchEvent(event);
        });

        inputElement.addEventListener("input", function () {
            const input = this.value.trim();
            if (/^\d{5}$/.test(input)) {
                checkStateByZipCode(input);
            } else {
                applyStateFilter(input);
            }

            if (input === "") {
                const filtersContainer = document.querySelector(".new-filters");
                // filtersContainer.style.pointerEvents = 'none';
                clearState.click();

                applyStateFilter(input);
            }
        });
    };

    applyAutocomplete(zipInput);
    applyAutocomplete(zipInputMobile);

    zipInput.addEventListener("input", function () {
        zipInputMobile.value = this.value;
        if (this.value == '') {
            clearStateSorting();
        }
    });

    zipInputMobile.addEventListener("input", function () {
        zipInput.value = this.value;
        if (this.value == '') {
            clearStateSorting();
        }
    });

    clearButton.addEventListener("click", function () {
        zipInput.value = "";
        zipInputMobile.value = "";
        clearState.click();
        clearStateSorting();
    });

    function clearStateSorting() {
        let selected = null;
        document
            .querySelectorAll(".find-dropdown.is-sort .filter-dropdown_radio")
            .forEach(function (e) {
                if (e.classList.contains("w--current")) {
                    selected = e;
                }
            });

        if (selected) {
            selected.click();
        } else {
            // const originalItemsOrder = listInstance.originalItemsOrder
            // listInstance.items = originalItemsOrder;
            // listInstance.renderItems(originalItemsOrder);
        }

        updateStateParam('')
    }

}

function checkStateByZipCode(zipCode) {
    if (/^\d{5}$/.test(zipCode)) {
        const apiUrl = `https://maps.google.com/maps/api/geocode/json?key=${apiKey}&components=postal_code:${zipCode}|country:US`;
        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                if (data.results && data.results.length > 0) {
                    const addressComponents = data.results[0].address_components;
                    const userLatLong = {
                        lat: data.results[0].geometry.location.lat,
                        lng: data.results[0].geometry.location.lng,
                    };
                    for (const component of addressComponents) {
                        if (component.types.includes("administrative_area_level_1")) {
                            const state = component.short_name;
                            applyStateFilter(state, userLatLong);
                            return;
                        }
                    }
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }
}

// Insurance Filter Management
$(".filter-dropdown_list.is-insurance .w-dyn-item").click(function () {
    document.querySelectorAll('.filter_radio-button.is-insurance').forEach((ele) => {
        if (ele.parentNode.classList.contains('is-active')) {
            ele.parentNode.classList.remove('is-active')
        }
    })
    setTimeout(() => {
        const radio = $(this).find('.filter_radio-button.is-insurance');
        if (radio.hasClass("w--redirected-checked")) {
            const labelText = $(this).find(".filter_radio-label").text();
            $(this).find(".filter_radio-button-field")[0].classList.add('is-active');
            $(".filter_tag-template.is-insurance")
                .text(labelText)
                .addClass("is-active");

            const params = new URLSearchParams(window.location.search);
            params.set('insurance', labelText);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
            fetchProviderProfiles();
        }
    }, 500);
});

// Insurance Filter Radio Button Change Event for mobile
// $('.filter-dropdown_list.is-insurance input[type="radio"]').change(function () {
//     // Remove active class from all
//     $('.filter_radio-button-field.is-api-ip').removeClass('is-active');

//     const selectedRadio = $(this);
//     const labelText = selectedRadio.closest('label').find('.filter_radio-label').text();

//     // Add active to the selected radio's parent
//     selectedRadio.closest('.filter_radio-button-field').addClass('is-active');

//     // Update tag template
//     $(".filter_tag-template.is-insurance")
//         .text(labelText)
//         .addClass("is-active");

//     // Update query params
//     const params = new URLSearchParams(window.location.search);
//     params.set('insurance', labelText); // set or replace

//     const newUrl = `${window.location.pathname}?${params.toString()}`;
//     window.history.replaceState({}, '', newUrl);

//     // Fetch data
//     // fetchProviderProfiles();
// });


$("#clear-insurance, #mobile-clear-insurance").click(function () {
    clearInsurance();
});

function clearInsurance(refresh = true) {
    const params = new URLSearchParams(window.location.search);
    params.delete("insurance");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    $(".filter_tag-template.is-insurance")
        .text("Insurance")
        .removeClass("is-active");


    document.querySelectorAll('.filter_radio-button.is-insurance').forEach((ele) => {
        if (ele.parentNode.classList.contains('is-active')) {
            ele.parentNode.classList.remove('is-active')
        }
    })
    $(".filter_radio-button.is-insurance").removeClass("w--redirected-checked");
    $(".w-dropdown").trigger("w-close");
    $('body').removeClass("no-scroll");
    $('[data-popup="insurance"]').hide();

    if (refresh) {
        fetchProviderProfiles();
    }
}

// Specialties Filter Management
$(".filter-dropdown_list.is-specialties .w-dyn-item, .filter_checkbox.is-specialty").click(function (e) {
    e.preventDefault();

    const isCheckbox = $(this).hasClass('filter_checkbox');
    const item = isCheckbox ? $(this).closest('.w-dyn-item') : $(this);
    const checkboxDiv = isCheckbox ? $(this) : item.find('.filter_checkbox.is-specialty');
    const checkboxInput = item.find('input[type="checkbox"]');
    const specialtyValue = checkboxInput.attr('id');

    const isChecked = checkboxInput.prop('checked');
    checkboxInput.prop('checked', !isChecked);
    checkboxDiv.toggleClass('w--redirected-checked', !isChecked);

    const params = new URLSearchParams(window.location.search);
    const currentSpecialties = params.getAll('specialties');

    if (!isChecked) {
        if (!currentSpecialties.includes(specialtyValue)) {
            params.append('specialties', specialtyValue);
        }
    } else {
        const updatedSpecialties = currentSpecialties.filter(s => decodeURIComponent(s) !== specialtyValue);
        params.delete('specialties');
        updatedSpecialties.forEach(s => params.append('specialties', s));
    }

    const selectedCount = params.getAll('specialties').length;
    $(".filter_tag-template.is-specialties")
        .text(selectedCount > 0 ? `${selectedCount} Selected` : "Specialties")
        .toggleClass("is-active", selectedCount > 0);

    $('.specialties-number').text(`(${selectedCount})`);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    fetchProviderProfiles();
});

// Mobile Specialties Checkbox Change Event
$('#mobile-specialties input[type="checkbox"]').change(function () {
    const checkboxInput = $(this);
    const checkboxDiv = checkboxInput.closest('label').find('.filter_checkbox');
    const specialtyValue = checkboxInput.attr('id');
    const isChecked = checkboxInput.prop('checked');

    checkboxDiv.toggleClass('w--redirected-checked', isChecked);

    const params = new URLSearchParams(window.location.search);
    let currentSpecialties = params.getAll('specialties');

    if (isChecked) {
        if (!currentSpecialties.includes(specialtyValue)) {
            params.append('specialties', specialtyValue);
        }
    } else {
        const updatedSpecialties = currentSpecialties.filter(s => decodeURIComponent(s) !== specialtyValue);
        params.delete('specialties');
        updatedSpecialties.forEach(s => params.append('specialties', s));
    }

    const selectedCount = params.getAll('specialties').length;
    $(".filter_tag-template.is-specialties")
        .text(selectedCount > 0 ? `${selectedCount} Selected` : "Specialties")
        .toggleClass("is-active", selectedCount > 0);

    $('.specialties-number').text(`(${selectedCount})`);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    fetchProviderProfiles();
});


function clearSpecialties(refresh = true) {
    const params = new URLSearchParams(window.location.search);
    params.delete("specialties");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    $(".filter_tag-template.is-specialties")
        .text("Specialties")
        .removeClass("is-active");

    $(".filter_checkbox.is-specialty").removeClass("w--redirected-checked");
    $("input[type='checkbox'][name='checkbox-3']").prop("checked", false);

    $(".w-dropdown").trigger("w-close");
    $('body').removeClass("no-scroll");
    $('[data-popup="specialties"]').hide();
    $('.specialties-number').text('(0)');

    if (refresh) {
        fetchProviderProfiles();
    }
}

// Modalities Filter Management
$(".filter-dropdown_list.is-modalities .w-dyn-item, .filter_checkbox.is-modality").click(function (e) {
    e.preventDefault();

    const isCheckbox = $(this).hasClass('filter_checkbox');
    const item = isCheckbox ? $(this).closest('.w-dyn-item') : $(this);
    const checkboxDiv = isCheckbox ? $(this) : item.find('.filter_checkbox.is-modality');
    const checkboxInput = item.find('input[type="checkbox"]');
    const modalityValue = checkboxInput.attr('id');

    const isChecked = checkboxInput.prop('checked');
    checkboxInput.prop('checked', !isChecked);
    checkboxDiv.toggleClass('w--redirected-checked', !isChecked);

    const params = new URLSearchParams(window.location.search);
    const currentModalities = params.getAll('modalities');

    if (!isChecked) {
        if (!currentModalities.includes(modalityValue)) {
            params.append('modalities', modalityValue);
        }
    } else {
        const updatedModalities = currentModalities.filter(m => decodeURIComponent(m) !== modalityValue);
        params.delete('modalities');
        updatedModalities.forEach(m => params.append('modalities', m));
    }

    const selectedCount = params.getAll('modalities').length;
    $(".filter_tag-template.is-modalities")
        .text(selectedCount > 0 ? `${selectedCount} Selected` : "Modalities")
        .toggleClass("is-active", selectedCount > 0);

    $('.modalities-number').text(`(${selectedCount})`);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    fetchProviderProfiles();
});

// Attach a change event to all checkbox inputs in mobile modality filter
$('#modality-collection input[type="checkbox"]').change(function () {
    const checkboxInput = $(this);
    const checkboxDiv = checkboxInput.closest('label').find('.filter_checkbox');
    const modalityValue = checkboxInput.attr('id');
    const isChecked = checkboxInput.prop('checked');

    // Toggle visual class
    checkboxDiv.toggleClass('w--redirected-checked', isChecked);

    // Update query parameters
    const params = new URLSearchParams(window.location.search);
    let currentModalities = params.getAll('modalities');

    if (isChecked) {
        if (!currentModalities.includes(modalityValue)) {
            params.append('modalities', modalityValue);
        }
    } else {
        const updatedModalities = currentModalities.filter(m => decodeURIComponent(m) !== modalityValue);
        params.delete('modalities');
        updatedModalities.forEach(m => params.append('modalities', m));
    }

    // Update UI label and count
    const selectedCount = params.getAll('modalities').length;
    $(".filter_tag-template.is-modalities")
        .text(selectedCount > 0 ? `${selectedCount} Selected` : "Modalities")
        .toggleClass("is-active", selectedCount > 0);

    $('.modalities-number').text(`(${selectedCount})`);

    // Update URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    // Fetch profiles
    fetchProviderProfiles();
});


function clearModalities(refresh = true) {
    const params = new URLSearchParams(window.location.search);
    params.delete("modalities");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    $(".filter_tag-template.is-modalities")
        .text("Modalities")
        .removeClass("is-active");

    $(".filter_checkbox.is-modality").removeClass("w--redirected-checked");
    $("input[type='checkbox'][name='checkbox-2']").prop("checked", false);

    $(".w-dropdown").trigger("w-close");
    $('body').removeClass("no-scroll");
    $('.modalities-number').text('(0)');
    if (refresh) {
        fetchProviderProfiles();
    }
}

// Clear Filters
$("#clear-modalities").click(function (e) {
    e.preventDefault();
    clearModalities();
});

$("#clear-specialties").click(function (e) {
    e.preventDefault();
    clearSpecialties();
});

['clear-trigger', 'clear-more-filters-1', 'mobile-clear-filters'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('click', function () {
            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, baseUrl);
            fetchProviderProfiles();
            clearSpecialties(false);
            clearInsurance(false);
            clearModalities(false);
            clearAvailabilityType();
            clearSort();
            clearDistance();
        });
    }
});

function clearDistance() {
    const distanceOption = $('input[name="distance"]').closest('.w-radio').find('.w-radio-input').removeClass('w--redirected-checked')
}

function clearDistance() {
    $('input[name="distance"]').each(function () {
        this.checked = false;

        const $wrapper = $(this).closest('.w-radio');
        $wrapper.removeClass('is-checked is-active');
        $wrapper.find('.w-radio-input').removeClass('w--redirected-checked');
    });

    $('#distance-label').text('Distance');
}



function clearAvailabilityType() {
    // Uncheck all visit type radio buttons and remove classes
    const radioButtons = document.querySelectorAll('input[type="radio"][name="type"]');
    radioButtons.forEach(radio => {
        radio.checked = false;
        const wrapper = radio.closest('label');
        if (wrapper) {
            wrapper.classList.remove('is-checked', 'is-active');
            const visualDiv = wrapper.querySelector('.filter_radio-button');
            if (visualDiv) {
                visualDiv.classList.remove('w--redirected-checked');
            }
        }
    });

    const visitLabel = document.getElementById('visit-label');
    if (visitLabel) {
        visitLabel.textContent = 'Visit type';
    }
}

function clearSort() {
    const sortLabel = document.querySelector('.filter_tag-template.is-sort');
    if (sortLabel) {
        sortLabel.textContent = 'Sort';
    }
}



// Form Handling
Webflow.push(function () {
    $("form").submit(function () {
        return false;
    });
});

$(".save").on("click", function (evt) {
    setTimeout(function () {
        $(".w-dropdown").trigger("w-close");
    }, 300);
});

function moveDivOnMobile() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const divToMove = document.getElementById("sort");

    if (viewportWidth <= 991) {
        const newParent = document.getElementById("mobile-sort");
        newParent.appendChild(divToMove);
    } else {
        const originalParent = document.getElementById("desktop-sort");
        originalParent.appendChild(divToMove);
    }
}

function handleSortChange(value) {
    const params = new URLSearchParams(window.location.search);
    params.set('sort_order', value);
    const sortLabel = document.querySelector('.filter_tag-template.is-sort');
    if (sortLabel) {
        sortLabel.textContent = value;
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    fetchProviderProfiles();
}


function setupSortListeners() {
    const sortOptions = document.querySelectorAll('.filter-dropdown_radio');
    sortOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const value = this.textContent.trim();
            handleSortChange(value);
        });
    });
}

moveDivOnMobile();
setupSortListeners();
window.addEventListener("resize", moveDivOnMobile);

// Visit Type Management
document.querySelectorAll('input[kckat="visit-type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
        document.querySelectorAll(".filter-dropdown_list .is-visittype").forEach((ele) => {
            if (ele.parentNode.classList.contains('is-active')) {
                ele.parentNode.classList.remove('is-active')
            }
        })
        if (this.checked) {
            const label = this.closest("label").textContent.trim();
            const value = this.value.trim();
            document.getElementById("visit-label").textContent = label;
            document.getElementById("visit-label").style.color = "#34353e";
            this.parentNode.classList.add('is-active');

            const params = new URLSearchParams(window.location.search);
            params.set('availability_type', value);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
            fetchProviderProfiles();
        }
    });
});