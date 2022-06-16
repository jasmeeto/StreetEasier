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
    function submitButtonOnClick(e) {
        e.preventDefault();
        console.log("StreetEasier popup submit");
        var addressValue = document.getElementById("commute-address").value;
        let display = document.getElementById("address-display");
        chrome.storage.sync.set({'address': addressValue}, function(){
            if (chrome.runtime.lastError) return;
            display.innerText = addressValue
            sendToAllTabs({action: 'sync'});
        });
    }

    let smit = document.getElementById("submit-form-button"); 
    // set address on click
    if(smit.addEventListener){
        smit.addEventListener("click",submitButtonOnClick,false);
    } else {
        //ie doesn't have addEventListner
        smit.attachEvent('onclick', submitButtonOnClick);
    }
}

// popup reload listener
window.addEventListener("load", () => {
    console.log("Reloaded")
    onPageRefresh()
});
