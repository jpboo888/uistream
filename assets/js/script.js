// Initialize modal
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems);
  });

// element selectors
var saveSettingsBtnEl = document.querySelector("#save-settings")
var searchBtn = document.querySelector("#search-Btn")
var cagedEl = document.querySelector("#caged")
var posterEl = document.querySelector("#movie-poster")
var movieInfoEl = document.querySelector("#movie-info")
var movieCardEl = document.querySelector("#movie-card-div")
var movieCardTitleEl = document.querySelector("#movie-title")
var movieCardPlotEl = document.querySelector("#movie-plot")
var streamingLinksEl = document.querySelector("#streaming-links")
var searchTerm = document.querySelector("#search-query")
var searchForm = document.querySelector("#search-form")
var altOfferingsDiv = document.querySelector("#alt-offerings")
var forPurchaseEl = document.querySelector("#for-purchase")
var forFreeEl = document.querySelector("#free-offerings")
var forSubscriptionEl = document.querySelector("#other-subscription-offerings")
var forFreeDiv = document.querySelector("#free-div")
var forBuyDiv = document.querySelector("#buy-div")
var forSubDiv = document.querySelector("#sub-div")
var altHeader = document.querySelector("#alt-stream-header")
var altSection = document.querySelector("#alt-offering-section")
var searchSettingsDisplay = document.querySelector("#current-streaming-searches")
var introEl = document.querySelector("#intro-content")

var apiKey = "9bad881e"
var apiKeyWm = "dezhiaeTxsUtpXsaOovSaiqfdtPCqBGaEazypOmf"

// Initialize empty arrays to store streaming service settings and previous search results
var streamingSettings = []
var prevMovieSearchs = []

// build a new streaming settings array that matches what Watchmode returns
var subsToCompare = []

var convertStreamingSettings = function(array) {
    // initialize back to empty before the user saves
    subsToCompare = []

    for (var i = 0; i < streamingSettings.length; i++) {
        if (streamingSettings[i] == "prime") {
            subsToCompare.push("Amazon Prime")
        } else if (streamingSettings[i] == "hulu") {
            subsToCompare.push("Hulu")
        } else if (streamingSettings[i] == "hbomax") {
            subsToCompare.push("HBO MAX")
        } else if (streamingSettings[i] == "netflix") {
            subsToCompare.push("Netflix")
        } else if (streamingSettings[i] == "disney") {
            subsToCompare.push("Disney+")
        }
    }
}

var saveSettingsHandler = function(event) {
    event.preventDefault()

    // reinitialize the value of the array back to zero at each save since they're resetting their values
    streamingSettings = []

    // grab the labels for all of the materialize checkboxes
    var streamingServiceLabels = document.querySelectorAll(".streaming-sources")

    // loop through the values of the labels since we can't directly searched for checked attribute with materialize checkboxes
    for(var i = 0; i < streamingServiceLabels.length; i++) {
        // get the name of the service associated with the checkbox
        var getServiceName = streamingServiceLabels[i].getAttribute("for")

        // set a variable to capture whether the service provider is selected
        var isChecked = document.getElementById(getServiceName).checked

        // if the streaming service is selected, add it to the streaming settings list
        if (isChecked) {
            streamingSettings.push(getServiceName)
        }
    }
    //save the settings to local storage
    saveSettings(streamingSettings)
}

// save the settings to local storage
var saveSettings = function(array) {
    localStorage.setItem("user-settings", JSON.stringify(array));

    // handle the search button status if they've saved items
    checkSettings(array)

    // create the array that has the actual 
    convertStreamingSettings(streamingSettings)
}

// load user settings from local storage
var loadSettings = function() {
    streamingSettings = JSON.parse(localStorage.getItem("user-settings"))

    // if nothing in localStorage, set the user settings back to an empty array
    if (!streamingSettings) {
        streamingSettings = []
    }
    // find the checkbox with the correct ID and set the checked element to checked on load
    for (var i = 0; i < streamingSettings.length; i++) {
        var streamingCheckBox = document.getElementById(streamingSettings[i])
        streamingCheckBox.setAttribute("checked","checked")

        // add the streaming services we're currently searching 
    }

    convertStreamingSettings(streamingSettings)
}

// disables the search button if there are no settings saved and enables it if there are
var checkSettings = function(array) {
    if (array.length == 0) {
        searchBtn.classList.add("disabled")
    } else {
        searchBtn.classList.remove("disabled")
    }
}

// Make an OMDb API call to get information about the movie searched for
var queryMovie = function(event) {
    event.preventDefault()

    var apiUrl = "https://www.omdbapi.com/?t=" + searchTerm.value + "&type=movie&apiKey=" + apiKey
    // make a request to the url
    fetch(apiUrl)
        .then(function(response) {

        // request was successful
        if (response.ok) {
           response.json().then(function(data) {
                // Clear out the search box
                searchTerm.value = ''

                // Clear out the intro text
                // introEl.textContent = ''
               // OMDb API appears returns an OK status, but Response: False (as a string) if the movie can't be found. Process that with a toast to a user.
               if (data.Response === "False") {
                // specify what we want in the toast alert
                var errorMsg1 = "<span>Movie not be found! Please try your search again.</span><button class='btn-flat toast-action' onclick='M.Toast.dismissAll()'>OK</button>"
                M.toast({html: errorMsg1})
                return
               }

               // otherwise, we're okay to process the data that gets passed in
                getMovieInfo(data)
                cagify(data)
           })
        } else {
            // Display a toast instead of an alert
            var errorMsg2= "<span>Movie not be found! Please try your search again.</span><button class='btn-flat toast-action' onclick='M.Toast.dismissAll()'>OK</button>"
            M.toast({html: errorMsg2})
        }
    })
        .catch(function(error) {
            // Catch for any errors from the server
            var errorMsg3="<span>Unable to connect to the Open Movie Database. Please try again later.</span><button class='btn-flat toast-action' onclick='M.Toast.dismissAll()'>OK</button>"
            M.toast({html: errorMsg3})
        })
}

// Make an watchmode API call to get information about the selected streaming services
var queryServices = function(titleId) {

    var apiUrl = "https://api.watchmode.com/v1/title/" + titleId + "/sources/?apiKey=" + apiKeyWm 

    // make a request to the url
    fetch(apiUrl)
        .then(function(response) {
        // request was successful
        if (response.ok) {
           response.json().then(function(data) {
                console.log(data)
                checkAltServices(data)
           })
        } else {
            // Print an error to the page if we can't find streaming services
            var noStreamingServices = document.createElement("p")
            noStreamingServices.classList.add("error-message")
            noStreamingServices.textContent = "Could not find any streaming services."

            // Hide the alt services div if it's already displayed
            altSection.classList.add("hidden")

            // Clear the streaming links div and add the error there
            streamingLinksEl.textContent = ''
            streamingLinksEl.append(noStreamingServices)
        }
    })
        .catch(function(error) {
            // Catch for any errors from the server
            var wmServerError = document.createElement("p")
            wmServerError.classList.add("error-message")
            wmServerError.textContent = "There was an issue connecting to the Watchmode API. Please try again later."

            movieInfoEl.append(wmServerError)
        })
}

var displaySearchSettings = function(streamingServiceArray) {
    // clear out section before each search
    searchSettingsDisplay.textContent = ''

    var streamingP = document.createElement("span")
    streamingP.textContent = "Displaying results for: "

    searchSettingsDisplay.append(streamingP)
    // loop through the fancified streaming service names and add them to the main section
    for (var i = 0; i < streamingServiceArray.length; i++) {
        var streamingServiceItem = document.createElement("span")
        streamingServiceItem.classList.add("streaming-service-display")
        streamingServiceItem.textContent = streamingServiceArray[i]

        searchSettingsDisplay.append(streamingServiceItem)
    }

}


var getMovieInfo = function(array) {
    // reset the content to blank before each search so things don't get weird
    posterEl.textContent = ""

    // diplay which streaming services we're searching against
    displaySearchSettings(subsToCompare)

    // unhide the movide card since we're ready to displaty info!
    movieCardEl.classList.remove("hidden")

    // build an object with the properties we can about for the movie
    var movieProperties = {
        title: array.Title,
        plot: array.Plot,
        imdbID: array.imdbID,
        year: array.Year,
        postersrc: array.Poster
    }

    queryServices(movieProperties.imdbID)

    // TODO -- Add in some handling for when there are no genres returned so we don't get an error from trying to split an empty string
    // get the genres associated with the movie and add to an array. Commenting out for now
    
    // var movieGenre = array.Genre
    // var movieGenreArray = movieGenre.split(',')
    // for (var i = 0; i < movieGenreArray.length; i++) {
    //     movieGenreArray[i] = movieGenreArray[i].trim()
    // }

    // only add the poster image to the page if we get something returned
    if(movieProperties.postersrc !== "N/A") {
        var posterImg = document.createElement("img")
            posterImg.setAttribute("src",movieProperties.postersrc)

            // append the poster image to the poster img div
            posterEl.append(posterImg)
    }
    

    // Assign the values to the correct spot in the card
    movieCardTitleEl.textContent = movieProperties.title
    
    // Handle when we get a movie, but no plot
    if (movieProperties.plot === "N/A") {
        movieCardPlotEl.textContent = "The plot for this movie is not available."
    } else {
        movieCardPlotEl.textContent = movieProperties.plot
    }

    // Look for the ID in the previous movie searches array to see if it's already saved. isMovieSaved will have a value of -1 
    // if it's not included in the array
    var isMovieSaved = prevMovieSearchs.findIndex(function(movie) {
        return movie.imdbID == movieProperties.imdbID
    })

    // if the movie isn't already present in the array, let's add it
    if(isMovieSaved === -1) {
        prevMovieSearchs.push(movieProperties)
    }

    // save to local storage
    saveMovieSearch(prevMovieSearchs)


}

// Save movie searches to history -- enables future features
var saveMovieSearch = function(array) {
    localStorage.setItem("previous-search-titles", JSON.stringify(array))
}

var loadMovieSearch = function() {
    prevMovieSearchs = JSON.parse(localStorage.getItem("previous-search-titles")) || []
}

// create an array of objs that includes the name of the service and the link to the movie on that service (opts: to rent, to buy, to subscribe, totally free)
var checkAltServices = function(movieArray) {
    // create a map to help is with the de-duping
    var altOfferingsMap = new Map()
    var streamingOfferingMap = new Map()


    // get each option that's returned and save it in to an object to evaluate
    movieArray.forEach( (offering , index) => {
        
        var serviceObj = {
            service: movieArray[index].name,
            type: movieArray[index].type,
            price: movieArray[index].price,
            link: movieArray[index].web_url
        }

        // check to see if the user has selected the streaming service for the link; if they have not, push it to the alt services array
        var isSubcription = false;

        for(var i = 0; i <subsToCompare.length; i++) {
            if(serviceObj.service == subsToCompare[i]) {
                isSubcription = true
            } 
        }



        if (!isSubcription) {
            // if it's not one of the streaming services they selected, add it to our map with the name of the service as the key to
            // helps us eliminate duplicate values (since all links are the same)
            altOfferingsMap.set(serviceObj.service, serviceObj)
        } else {
            streamingOfferingMap.set(serviceObj.service, serviceObj)
        }
        
    })
    // function call to display the offerings
    displayAltServices(altOfferingsMap)
    displaySelServices(streamingOfferingMap) 
}

// function to build out each individual section, since we should be able to use the same logic
var displaySelServices = function(map) {

    // clear out the divs that we're appending to if there's content there already
    streamingLinksEl.textContent = ""
  
    // build lists to store each item
    var forSelectListEl = document.createElement("ul")

    // initialize counters so we know how much belong in each category
    var selCount = 0

    // for each entry in the map, create a list item and add the link and service name
    map.forEach(function(value,key) {
        var selLink = value;
        var selItemLi = document.createElement("li")
        selItemLi.innerHTML = "<a href='" + selLink.link + "' target='_blank'>" + key + "</a>"
        
        forSelectListEl.append(selItemLi);
        selCount++
    })

    if (selCount > 0) {
        streamingLinksEl.append(forSelectListEl)
    } else {
        var noMovieError = document.createElement("p")
        noMovieError.textContent = "We couldn't find the movie available for streaming on any of your selected services. Please see the list below for additional options!"
        
        streamingLinksEl.append(noMovieError)
    }


}


// function to build out each individual section, since we should be able to use the same logic
var displayAltServices = function(map) {
    // remove hidden class from the cards
    altSection.classList.remove("hidden")
    altHeader.classList.remove("hidden")

    // clear out the divs that we're appending to if there's content there already
    forBuyDiv.innerHTML = ""
    forFreeDiv.innerHTML = ""
    forSubDiv.innerHTML = ""
    

    // build lists to store each item
    var forPurchaseListEl = document.createElement("ul")
    var freeList = document.createElement("ul")
    var subList = document.createElement("ul")

    // initialize counters so we know how much belong in each category
    var buyCount = 0
    var freeCount = 0
    var subscribeCount = 0

    // for each entry in the map, create a list item and add the link and service name
    map.forEach(function(value,key) {
        var subLink = value;
        var movieItemLi = document.createElement("li")
        movieItemLi.innerHTML = "<a href='" + subLink.link + "' target='_blank'>" + key + "</a>"

        if (subLink.type == "rent" || subLink.type == "buy" ) {
            forPurchaseListEl.append(movieItemLi)
            buyCount++
        } else if (subLink.type == "free") {
            freeList.append(movieItemLi)
            freeCount++
        } else if (subLink.type == "sub") {
            subList.append(movieItemLi)
            subscribeCount++
        }
    })

    // Append each list to the correct div as long as the list has entries
    if (buyCount > 0) {
        forBuyDiv.innerHTML = '<h4>For rent or purchase</h4>'
        forBuyDiv.append(forPurchaseListEl) 
    } 
    
    if (freeCount > 0) {
        forFreeDiv.innerHTML = '<h4>Free!</h4>'
        forFreeDiv.append(freeList) 
    }
    
    if (subscribeCount > 0) {
        forSubDiv.innerHTML = '<h4>Subscription services</h4>'
        forSubDiv.append(subList)
    }
    

}

// Display a wonderful picture of Nicolas Cage when they view a Nicolas Cage movie
var cagify = function(array) {
    // hide image at the start of the search
    cagedEl.classList.add("hidden")

    var actorSearch = array.Actors;
    var actorArray = actorSearch.split(',')
    for (var i = 0; i < actorArray.length; i++) {
        actorArray[i] = actorArray[i].trim()
    }

    var isCageMovie = actorArray.indexOf("Nicolas Cage")
    if (isCageMovie !== -1) {
        cagedEl.classList.remove("hidden")
    }
}

// Function calls on page load
loadSettings()
loadMovieSearch()
checkSettings(streamingSettings)


// save the settings when a user clicks the Save Settings button
saveSettingsBtnEl.addEventListener("click" , saveSettingsHandler)

// Listen for an "enter" press on the text field
searchForm.addEventListener("submit", queryMovie)