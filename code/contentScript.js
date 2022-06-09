
var address = ''

function pullFromStorage() {
    chrome.storage.sync.get(function(items){
        if (chrome.runtime.lastError) {
            return;
        }
        console.log("Updated address")
        address = items.address
        if (address === undefined) {
            address = "1 World Trade Center"
        }
    });
}

// pull from storage on js load
pullFromStorage()

// listens for events/actions from runtime
chrome.runtime.onMessage.addListener(
    function (req, sender, sendResponse) {
        if (req.action == 'sync') {
            // reload on a sync call, i.e when storage data changes
            pullFromStorage()
            window.location.reload();
        }
    }
);

if (document.readyState === "complete") {
    console.log("loaded content script 1")
    // Fully loaded!
}
else if(document.readyState === "interactive") {
    // DOM ready! Images, frames, and other subresources are still downloading.
}
else {
    // Loading still in progress.
    // To wait for it to complete, add "DOMContentLoaded" or "load" listeners.


    // structure listing cards in a better way
    function reStyleList() {
        const container = document.querySelector("main.Container")
        container.style.width = "100%"
        container.style.margin = "0px" 
        const searchList = document.querySelector("ul.searchCardList")
        searchList.style.flexFlow="wrap"
        const listItems = searchList.querySelectorAll("li.searchCardList--listItem")
        listItems.forEach(el => {
            el.style.width="250px"
        })
        const lTwoThirds = document.querySelector("div.left-two-thirds")
        lTwoThirds.style.width="100%"


        async function returnDomFromURL(url) {
            const res = await fetch(url);
            const html = await res.text();
            var parser = new DOMParser();
	        var doc = parser.parseFromString(html, 'text/html')
            return doc
        }

        // Add date published and other vitals info to listing cards
        Array.from(listItems).forEach(async li => {
            const url = li.querySelector("a").href
            console.log("fetching:", url)
            var doc = await returnDomFromURL(url)
            var impText = Array.from(doc.querySelectorAll(".Vitals-data")).map(x => x.innerText.trim()).join(" | ")
            const parent = li.querySelector("address").parentElement
            const textEl = document.createElement('div')
            textEl.innerText = impText
            parent.appendChild(textEl)
            console.log("appended for:", url) 
            console.log("appended with:", impText) 
        })

        // Pull listing cards from all pages 
        // START 
        const lastPageString = Array.from(document.querySelectorAll(".page")).pop().innerText
        const lastPageNum = parseInt(lastPageString)

        var url = new URL(window.location.href);


        const pageNumToListItems = {}
        const list = []
        for (var pageNum = 2; pageNum <= lastPageNum; pageNum++) {
            list.push((async function () {
                const newPageNum = `${pageNum}`
                url.searchParams.set("page", newPageNum)
                var doc = await returnDomFromURL(url)

                const pageListItems = doc.querySelectorAll("li.searchCardList--listItem")
                console.log("LIST ITEMS:", newPageNum, pageListItems)
                
                pageNumToListItems[newPageNum] = pageListItems
            })())
        }

        (async function () {
            await Promise.all(list)

            for (var pageNum = 2; pageNum <= lastPageNum; pageNum++) {
                const newPageNum = `${pageNum}`
                const pageListItems = pageNumToListItems[newPageNum]
                Array.from(pageListItems).forEach(li => {
                    searchList.appendChild(li)
                })
            }
        })()
        // END

    }

    function onPageRefresh() {
        // Every page
       
        // clone header nav button and replace link with link to searches
        let list = document.querySelector("#site-menu * ul")
        let listItem = document.querySelector("#site-menu * ul > li")
        let searchItem = listItem.cloneNode(true)
        list.appendChild(searchItem)
        let searchLink = searchItem.querySelector("a")
        searchLink.innerText = "Searches"
        searchLink.href = "/my/saved_searches"
        console.log(searchItem)
        const banner = document.querySelector("div[data-se-entry-hydrate='contentManagementSystem']")
        if (banner) {
            banner.style.display = 'none'
        }


        // Set up map element and iframe
        // START
        const mapDiv = document.createElement('div')
        const origin = encodeURIComponent("tmp")
        const dest = encodeURIComponent(address)

        var iframe = `
        <iframe
            width="400"
            height="500"
            frameborder="0" style="border:0"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyA3u5m9A9TYMR0ZIWNfceQYdDE_HUzO9HU&mode=transit&origin=${origin}&destination=${dest}"
            allowfullscreen>
        </iframe>
        `
        mapDiv.innerHTML += iframe
        const h2 = document.createElement("h2")
        h2.innerText = "Commute Map"
        mapDiv.prepend(h2)
        // END

        function createMap(listingAddress, elementToInsertIn) {
            const origin = encodeURIComponent(listingAddress)
            const dest = encodeURIComponent(address)
            const iframe = mapDiv.querySelector('iframe')
            const src = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyA3u5m9A9TYMR0ZIWNfceQYdDE_HUzO9HU&mode=transit&origin=${origin}&destination=${dest}`

            iframe.setAttribute("src", src)
        }

        // On search result page
        if (document.getElementById("ResultBox")) {
            console.log("On results page")

            // find current map
            //const map = document.querySelector("div.se_embed_react[data-se-entry='map']")
            const map = document.querySelector("#sidebar-map-static").parentElement
            map.innerHTML = ""
            map.prepend(mapDiv)
            console.log("mapdiv", mapDiv)
            console.log("map", map)


            document.addEventListener('mousemove', function checkHover(e) {
                const el = document.elementFromPoint(e.clientX, e.clientY)
            
                if (el !== checkHover.el) {
                    //console.log("really hovered over", el)
                    if (el && el.matches("ul > li > div > a")) {
                        const listingAddress = el.parentElement.querySelector("address").innerText
                        createMap(listingAddress, map)
                    }

                    checkHover.el = el;
                }
            });

            reStyleList()

        // On listing page
        } else if (document.querySelector(".row.DetailsPage")) {
            const listingAddress = document.querySelector("h1.building-title").innerText
            const rightColumn = document.querySelector("article.right-two-fifths")
            createMap(listingAddress, rightColumn)
            let elementToInsertIn = rightColumn
            elementToInsertIn.prepend(mapDiv)

            
        // Any other page
        } else {
          // If 
        }
    }

    window.addEventListener("DOMContentLoaded", () => {
        // DOM ready! Images, frames, and other subresources are still downloading.
    });

    let lastUrl = location.href; 
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onPageRefresh()
      }
    }).observe(document, {subtree: true, childList: true});

    window.addEventListener("load", () => {
        // on Page refresh
        console.log("Reloaded")
        onPageRefresh()
    });

   
}