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


function simpleHash(...values) {
    // Combine input values into a single string
    let combinedData = values.join('');

    var hash = 0;
    if (combinedData.length === 0) return hash.toString(16);

    for (var i = 0; i < combinedData.length; i++) {
        var char = combinedData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert the hash to a hex string
    let hashHex = (hash >>> 0).toString(16);  // ">>>" ensures we get an unsigned value

    // Return the last 8 characters
    return hashHex.slice(-8);
}
