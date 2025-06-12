$('.map-filter_dd-link')[0].click()
$('#fs-option-all-states')[0].click()


let states = $('.map-filter_dd-list')[1].children
$.each(states, (key , item) => {
    if($(item).is('a')) {
        if(param === $(item).text()) {
            let stateId = $(item).attr('id');
            stateId[0].click()
        }
         console.log(key, $(item).text(), $(item).attr('id'))   
    }
})


let states = $('.map-filter_dd-list')[1].children;
$.each(states, (key, item) => {
    if ($(item).is('a')) {
        if ('Arizona' === $(item).text()) {
            $(item)[0].click();
            $(item)[0].attr('aria-selected')= true;
            $(item)[0].class('w--current');
            $(item)[0].tabindex = -1;

            return; // correct for $.each
        }
    }
});

<a fs-combobox-element="option-template" href="#" class="map-filter_dd-link w--current" tabindex="-1" id="fs-option-alaska" aria-setsize="51" aria-posinset="2" role="option" aria-selected="true">Alaska</a>