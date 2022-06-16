// send message to all tabs from popup
function sendToAllTabs(message, callback) {
    chrome.tabs.query({
        url: ["*://streeteasy.com/*"]
    }, function(tabs) {
        for (var i=0; i<tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message, callback);
        }
    });
}

// refresh of popup
function onPageRefresh() {
    // update to current stored address
    chrome.storage.sync.get(function(items) {
        if (chrome.runtime.lastError) {
            return;
        }
        if (items.address !== undefined) {
            var addressInput = document.getElementById("commute-address");
            let display = document.getElementById("address-display");
            addressInput.value = items.address;
            display.innerText = items.address
        }
    });

    // set address
    function submitEventListener(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("StreetEasier popup submit");
        var addressValue = document.getElementById("commute-address").value;
        let display = document.getElementById("address-display");
        chrome.storage.sync.set({'address': addressValue}, function(){
            if (chrome.runtime.lastError) return;
            display.innerText = addressValue;
            sendToAllTabs({action: 'sync'});
        });
    }

    let addressForm = document.getElementById("popup-address-form");
    let submitButton = document.getElementById("popup-address-form__submit-button");
    setEventListener(addressForm, 'submit', submitEventListener);
    setEventListener(submitButton, 'click', submitEventListener);
}

function setEventListener(element, eventName, listener) {
    if (element.addEventListener) {
        console.log(`${element.tagName} setting addEventListener: ${eventName}`);
        element.addEventListener(eventName, listener, false);
    } else {
        eventName = 'on' + eventName;
        console.log(`${element.tagName} setting attachEvent: ${eventName}`);
        element.attachEvent(eventName, listener);
    }
}

// popup reload listener
window.addEventListener("load", () => {
    console.log("Reloaded")
    onPageRefresh()
});
