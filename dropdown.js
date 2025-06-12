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