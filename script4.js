const distanceRadios = document.querySelectorAll('input[type="radio"][name="distance"]');
distanceRadios.forEach(radio => {
    radio.addEventListener('change', function () {
        const selectedValue = this.value;
        const params = new URLSearchParams(window.location.search);
        params.set('radius_miles', selectedValue);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        fetchProviderProfiles();
    });
});

// Core functionality for provider profile management
const API_URL = 'https://9ja7n2qnce.execute-api.us-east-1.amazonaws.com/prod/fay-api/provider-profiles';

// State management
let continuationToken = null;
let currentPage = 0;
let tokenHistory = [null];

// Filter management
function getFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {};

    // Insurance filter
    const insurance = urlParams.getAll('insurance');
    if (insurance.length > 0) filters.insurance = insurance;

    // Location filters
    const locationUSState = urlParams.get('state');
    if (locationUSState) {
        filters.state = locationUSState;
        const locationCoordinates = urlParams.get('location_coordinates');
        if (locationCoordinates) filters.location_coordinates = locationCoordinates;
    }

    // Specialty and modality filters
    const specialties = urlParams.getAll('specialties').map(s => s.toLowerCase());
    if (specialties.length > 0) filters.specialties = specialties;

    const modalities = urlParams.getAll('modalities').map(m => m.toLowerCase());
    if (modalities.length > 0) filters.modalities = modalities;

    // Availability and sort filters
    const availabilityType = urlParams.getAll('availability_type').map(m => m.toLowerCase());
    if (availabilityType.length > 0) filters.availabilityType = availabilityType;

    const sortOrder = urlParams.getAll('sort_order').map(m => m.toLowerCase());
    if (sortOrder.length > 0) filters.sortOrder = sortOrder;

    // Distance filter
    const radiusMiles = urlParams.get('radius_miles');
    if (radiusMiles) filters.radiusMiles = radiusMiles;

    return filters;
}

// Provider profile fetching and rendering
async function fetchProviderProfiles(token = null) {
    try {
        const container = document.getElementById('dietitian-items-container');
        container.innerHTML = '';

        const paginationWrapper = document.querySelector('.pagination_buttons');
        if (paginationWrapper) {
            paginationWrapper.classList.add('hide');
        }
        const loader = document.querySelector('[fs-cmsload-element="loader"]');
        const emptyState = document.querySelector('[fs-cmsload-element="empty"]');

        // if (emptyState && loader) {
        //     // Hide the entire emptyState first
        //     emptyState.style.display = 'block';

        //     // Loop through all child elements inside emptyState
        //     [...emptyState.children].forEach(child => {
        //         if (child === loader) {
        //             child.style.display = 'block'; // Show only loader
        //         } else {
        //             child.style.display = 'none'; // Hide everything else
        //         }
        //     });
        // }

        const filters = getFiltersFromURL();
        const params = new URLSearchParams();

        // Add filters to params
        if (filters.insurance) params.set('insurance', filters.insurance);
        if (filters.state) {
            params.append('location_us_state', filters.state);
            params.append('supported_us_states', filters.state);
            if (filters.location_coordinates) params.append('location_coordinates', filters.location_coordinates);
        }
        if (filters.radiusMiles) params.append('radius_miles', filters.radiusMiles);
        if (filters.specialties) filters.specialties.forEach(s => params.append('specialties', s));
        if (filters.modalities) filters.modalities.forEach(m => params.append('modalities', m));

        // Handle availability types
        const availabilityMap = {
            'in-person': ['in_person'],
            'video-only': ['virtual'],
            'video-in-person': ['in_person', 'virtual'],
        };
        if (filters.availabilityType) {
            filters.availabilityType.forEach(type => {
                const values = availabilityMap[type];
                if (values) values.forEach(v => params.append('availability_type', v));
            });
        }

        // Handle sort order
        const sortOrderMap = {
            'recommended': 'ranking',
            'availability': 'availability',
            'best health outcomes': 'outcomes'
        };
        if (filters.sortOrder) {
            filters.sortOrder.forEach(order => {
                const value = sortOrderMap[order];
                if (value) params.append('sort_order', value);
            });
        }

        // Handle pagination
        if (token) {
            params.append('continuation_token', token);
        } else {
            currentPage = 0;
        }
        // const emptyState = document.querySelector('[fs-cmsload-element="empty"]');
        // if (loader) loader.style.display = 'block';
        // if (emptyState) emptyState.style.display = 'none';

        // Fetch data
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (response.status === 422) {
            if (emptyState) emptyState.style.display = 'block';
            if (loader) loader.style.display = 'none';
            return;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.items.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (loader) loader.style.display = 'none';
            return;
        }
        renderProviderProfiles(data);
        updatePagination(data.continuation_token);

    } catch (error) {
        console.error('Error fetching provider profiles:', error);
        // Show error state if needed
    }
}

// Render provider profiles
function renderProviderProfiles(data) {
    const container = document.getElementById('dietitian-items-container');
    const template = document.getElementsByClassName('dietitian-item');
    if (!container || !template.length) return;

    container.innerHTML = '';

    data.items.forEach(provider => {
        const card = template[0].cloneNode(true);

        // Set basic info
        card.querySelector('.jetboost-list-item').value = provider.slug;
        card.querySelector('.h3').textContent = provider.full_name_and_credentials;

        // Set image
        const image = card.querySelector('.dietitian_img');
        if (image) {
            image.src = provider.photo_url;
            image.alt = provider.full_name_and_credentials;
        }

        // Set insurance info
        const ins = card.querySelector('.insurances-text');
        if (ins && provider.insurance_accepted) {
            ins.textContent = provider.insurance_accepted.join(', ');
        }

        // Set specialties
        const spec = card.querySelector('.specialties-text');
        if (spec && provider.specialties) {
            spec.textContent = provider.specialties.map(s => s.name).join(', ');
        }

        // Set states
        const states = card.querySelector('.states-text');
        if (states && provider.supported_us_states) {
            states.textContent = provider.supported_us_states.join(', ');
        }

        // Set modalities
        const modalitiesList = card.querySelector('.modalities_list');
        if (modalitiesList) {
            modalitiesList.querySelectorAll('.modality_item').forEach(i => i.remove());
            if (provider.modalities) {
                provider.modalities.forEach(modality => {
                    const item = document.createElement('div');
                    item.className = 'modality_item is-api-ip';
                    const emojiDiv = document.createElement('div');
                    emojiDiv.className = 'modality_emoji is-api-ip';
                    emojiDiv.textContent = '❓';
                    const nameDiv = document.createElement('div');
                    nameDiv.textContent = modality.name;
                    item.appendChild(emojiDiv);
                    item.appendChild(nameDiv);
                    modalitiesList.appendChild(item);
                });
            }
        }

        // Set availability
        const visitsWrap = card.querySelector('.dietitian_visits-wrap');
        if (visitsWrap) {
            const outerVisitBlock = visitsWrap.querySelector('.dietitian_visit');
            const innerVisitBlock = outerVisitBlock?.querySelector('.dietitian_visit');
            const availability = provider.availability_types || [];

            if (!availability.includes('virtual')) {
                outerVisitBlock?.remove();
            } else if (!availability.includes('in_person') && innerVisitBlock) {
                innerVisitBlock.remove();
            }
        }

        // Set links
        const bookNow = card.querySelector('.btn.cc-mobile-50');
        const viewProfile = card.querySelector('.btn.cc-secondary');
        const viewProfile1 = card.querySelector('.dietitian_card-link-overlay');

        if (bookNow && provider.booking_url) bookNow.href = provider.booking_url;
        if (viewProfile && provider.profile_url) viewProfile.href = provider.profile_url;
        if (viewProfile1 && provider.profile_url) viewProfile1.href = provider.profile_url;

        card.style.display = 'block';
        container.appendChild(card);
    });

    // Update UI elements
    const countElement = document.querySelector('.dieitian-count .bold-span');
    if (countElement) countElement.textContent = data.total;

    const sectionListTopElements = document.getElementsByClassName('section_list_top');
    Array.from(sectionListTopElements).forEach(el => el.classList.remove('hide'));

    // Hide loading states
    const loader = document.querySelector('[fs-cmsload-element="loader"]');
    const emptyState = document.querySelector('[fs-cmsload-element="empty"]');
    if (loader) loader.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update pagination UI
function updatePagination(newToken) {
    continuationToken = newToken || null;
    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    const paginationWrapper = document.querySelector('.pagination_buttons');

    if (prevBtn) {
        if (currentPage === 0) {
            prevBtn.classList.add('hide');
        } else {
            prevBtn.classList.remove('hide');
        }
    }

    if (nextBtn) {
        if (continuationToken) {
            nextBtn.classList.remove('hide');
        } else {
            nextBtn.classList.add('hide');
        }
    }

    if (paginationWrapper) {
        paginationWrapper.classList.remove('hide');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Pagination listeners
    const nextBtn = document.getElementById('pagination-next');
    const prevBtn = document.getElementById('pagination-prev');

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (continuationToken) {
                currentPage++;
                tokenHistory[currentPage] = continuationToken;
                fetchProviderProfiles(continuationToken);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 0) {
                currentPage--;
                const prevToken = tokenHistory[currentPage];
                fetchProviderProfiles(prevToken);
            }
        });
    }

    setTimeout(() => {
        applyPreselectedValues();
    }, 1000); // Delay to ensure all elements are loaded


    // Initial load
    fetchProviderProfiles();
});

// pre selected vlaues
function applyPreselectedValues() {
    const urlParams = new URLSearchParams(window.location.search);

    // Apply insurance filter
    const insurance = urlParams.get('insurance');

    if (insurance) {
        // Get all labels
        const labels = document.querySelectorAll('.filter_radio-label.is-api-ip');

        labels.forEach(label => {
            const labelText = label.textContent.trim().toLowerCase();
            if (labelText === insurance.toLowerCase()) {
                const input = label.closest('label').querySelector('input[type="radio"]');
                input.parentNode.classList.add('is-active');
                const customRadio = label.closest('label').querySelector('.filter_radio-button');

                if (input) {
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (customRadio) {
                    customRadio.click();
                }
            }
        });
    }

    // Apply specialties filter based on URL params
    const specialties = urlParams.getAll('specialties');
    if (specialties.length > 0) {
        const labels = document.querySelectorAll('.filter_checkbox-label.is-api-ip');
        const specialityElement = document.querySelector('.is-specialties').innerHTML = `${specialties.length} Selected`;
        document.querySelector('.is-specialties').classList.add('is-active');
        document.querySelector('.specialties-number').textContent = `(${specialties.length})`;

        labels.forEach(label => {
            const labelText = label.textContent.trim().toLowerCase();

            specialties.forEach(specialty => {
                const labelValue = label.parentNode.querySelector('input[type="checkbox"]').getAttribute('id');
                if (labelValue === specialty.trim().toLowerCase()) {
                    const checkboxDiv = label.closest('label').querySelector('.filter_checkbox.is-specialty');

                    if (checkboxDiv) {
                        $(checkboxDiv).addClass('w--redirected-checked');
                    }
                }
            });
        });
    }



    // Apply modalities filter
    // Apply modalities filter from URL params
    const modalities = urlParams.getAll('modalities');

    if (modalities.length > 0) {
        const labels = document.querySelectorAll('.filter_checkbox-label.is-api-ip');
        const modalitiesElement = document.querySelector('.is-modalities').innerHTML = `${modalities.length} Selected`;
        document.querySelector('.is-modalities').classList.add('is-active');
        document.querySelector('.modalities-number').textContent = `(${modalities.length})`;

        labels.forEach(label => {
            const labelText = label.textContent.trim().toLowerCase();

            modalities.forEach(modality => {
                const labelValue = label.parentNode.querySelector('input[type="checkbox"]').getAttribute('id');
                if (labelValue === modality.trim().toLowerCase()) {
                    const checkboxDiv = label.closest('label').querySelector('.filter_checkbox.is-modality');

                    if (checkboxDiv) {
                        // $(checkboxDiv).trigger('click');  
                        $(checkboxDiv).addClass('w--redirected-checked');
                    }
                }
            });
        });
    }


    // Apply availability type filter
    const availabilityType = urlParams.getAll('availability_type');
    if (availabilityType.length > 0) {
        availabilityType.forEach(type => {
            const radioInput = document.querySelector(`input[type="radio"][value="${type}"]`);
            if (radioInput && !radioInput.checked) {
                // Mark radio as checked
                radioInput.checked = true;

                const wrapper = radioInput.closest('label');
                if (wrapper) {
                    // Add classes to label
                    wrapper.classList.add('is-checked', 'is-active');

                    // Add visual selected class
                    const visualDiv = wrapper.querySelector('.filter_radio-button');
                    if (visualDiv) {
                        visualDiv.classList.add('w--redirected-checked');
                    }

                    // Update visit label text
                    const labelText = wrapper.querySelector('.filter_radio-label')?.textContent.trim();
                    if (labelText) {
                        const visitLabel = document.getElementById('visit-label');
                        if (visitLabel) {
                            visitLabel.textContent = labelText;
                        }
                    }
                }
            }
        });
    }

    const sortValue = urlParams.get('sort_order');
    if (sortValue) {
        const dropdownToggle = document.querySelector('.filter_tag-template.is-sort');
        if (dropdownToggle) {
            dropdownToggle.textContent = sortValue;

        }
    }


    // Apply distance filter
    const radiusMiles = urlParams.get('radius_miles');
    if (radiusMiles) {
        const distanceOption = $('input[name="distance"][value="' + radiusMiles + '"]').closest('.w-radio').find('.w-radio-input').addClass('w--redirected-checked')
    }
}