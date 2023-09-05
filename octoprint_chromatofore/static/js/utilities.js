function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}


function toI2cAddress(value) {
    return "0x" + value.toString(16).toUpperCase().padStart(2, '0');
}

function toI2cChannel(value) {
    return "0x" + value.toString(16).toUpperCase();
}


const gpioChannels = ko.observableArray(
    Array.from({ length: 8 }, (_, i) => '0x' + i.toString(16).toUpperCase())
);

const servoChannels = ko.observableArray(
    Array.from({ length: 16 }, (_, i) => '0x' + i.toString(16).toUpperCase())
);  

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
