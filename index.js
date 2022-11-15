// Upon page load, the following event listener fetches information
// from the DHS's Global Entry appointment API. This data includes all the
// information we will need to construct our application.

document.addEventListener("DOMContentLoaded", function() {
    initializeGEAL()
    datePicker()
})

function initializeGEAL(){
    fetch('https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry')
    .then(response => response.json())
    .then(locationData => {
        pullData(locationData)
    })
}

// The following lists are used for data manipulation in the proceeding
// functions.

// The variable "stateSorter" will also come in handy for, well...
// sorting states!

let locationNames = []
let locationInfo = []
let validStates = []
let stateSorter

// The following function pulls the data from the .JSON file generated by
// the fetch request in the initializing event listener.

// First, it creates a workable list (array) of Global Entry interview centers 
// and stores them in the variable "locationNames." 

// Second, it creates another workable list which contains the list of 
// states in which a Global Entry interview center can be found. This is
// important, because not every state/American territory has a Global Entry
// interview center! This list is entitled "validStates."

// Next, it creates yet another workable list containing objects which
// themselves contain pertinent information on our interview centers. 
// This list is entitled "locationInfo" and is very important to the
// smooth functioning of our application and the success of our users.
// The information in this list includes the centers' addresses, phone numbers, 
// and other useful information that will help our users get to their 
// appointments after we've helped them secure a coveted appointment 
// in a timely manner.

// Next, our function invokes the .sort() method on our list of states. 
// You'll know that's "validStates," if you've been keeping up! This method
// will sort our list of states in alphabetical order so we can generate 
// our convenient dropdown lists in an intuitive manner for our users.

// Lastly, this function invokes other functions further down in our
// code. These functions are "renderStates()" and "renderLocations()." 
// They serve similar purposes but both perform discrete actions 
// that are important to us and to our users!

function pullData(locationData){
    locationData.forEach((location) => {
        if (location.shortName !== "Permanently Closed") {
            if (location.state !== "" && location.countryCode === "US") {
                locationNames.unshift(location.state + ": " + location.name)
                if (validStates.includes(location.state) === false) {
                    validStates.unshift(location.state)
                }
            }
        }
    locationInfo.unshift(
        {name: `${location.name}`,
        locationId: `${location.id}`,
        address: `${location.address}`,
        city: `${location.city}`,
        state: `${location.state}`,
        phoneNumber: `${location.phoneNumber}`,}
        )
    })
    validStates.sort()
    renderStates()
    renderLocations()
}

// The following function, renderStates(), creates the dropdown menu
// from which our users select their desired state in which to search
// for Global Entry interview appointments.

// This function also contains an event listener, which allows our users
// to sort Global Entry interview centers by their desired state.

function renderStates() {
    validStates.forEach((state) => {
        const stateSelector = document.getElementById('state-selector')
        const generateOptions = document.createElement('button')
        generateOptions.innerText = state
        generateOptions.className = "dropdown-item"
        // event listener for when a state is selected
        generateOptions.addEventListener('click', (e) =>{
            e.preventDefault()
            stateSorter = e.target.innerText
            let stateButtonText = document.getElementById('state-menu')
            // I THINK WE SHOULD CONSIDER THE DROP DOWN NOT HAVING THE STATE
            // AS THE DISPLAY TEXT BECAUSE IT MAKES IT SO THE LOCATION IS MUCH TOO LONG
            // MAYBE WE CAN DISPLAY IT UNDERNEITH INSTEAD
            stateButtonText.innerText = stateSorter
            renderLocations(stateSorter)        
        })
        stateSelector.appendChild(generateOptions)
    })
}

// The following function, renderLocations(), creates the dropdown menu
// which contains each valid Global Entry interview center serviced by our
// application. 

// This function also contains an event listener that passes the user's
// desired location's information to yet another function which renders
// that information on the page.

function renderLocations(stateSorter) {
// sorts alphabetically
    const locationSelector = document.getElementById('location-selector')
    while (locationSelector.firstChild) {
        locationSelector.removeChild(locationSelector.firstChild)
    }
    locationNames.sort()
    locationNames.forEach((location) => {
        if ((`${location[0] + location[1]}`) === stateSorter) {
            const generateOptions = document.createElement('button')
            generateOptions.innerText = location
            generateOptions.className = "dropdown-item"
            const stringName = `${location}`
            generateOptions.id = stringName.substring(4)
            const nameNoAbbreviation = stringName.substring(4)
        // grab the state abbrevs. and make them the IDs of each location so we can filter with them
            locationSelector.appendChild(generateOptions)
            generateOptions.addEventListener('click', (e) =>{
                e.preventDefault()
                renderLocationInfo(nameNoAbbreviation) 
                // console.log(typeof nameNoAbbreviation)
                // console.log(nameNoAbbreviation)     
            })
        }
    })
}

// The following function, renderLocationInfo(), does just what it says it
// does! When invoked by the above function, the name, address, and 
// phone number of our user's desired location is displayed on the screen
// in our handy cloud container.

// Although the cloud may appear empty at first, don't worry! Selecting
// a state and location will prompt our nimbus friend to display the
// information for which our users are searching.

// This function also performs a crucial operation for our users:
// it passes their desired location's ID to another function which will
// poll the DHS's API for Global Entry interview appointments!

function renderLocationInfo(locationInput){
    let addyPlaceholder = document.getElementById('locationAddress')
    let namePlaceholder = document.getElementById('locationName')
    let phonePlaceholder = document.getElementById('locationPhone')
    let locationMenu = document.getElementById('location-menu')
    let cityStatePlaceholder = document.getElementById('locationCityState')
    locationInfo.forEach((location) => {
        if (location.name === locationInput) {
            addyPlaceholder.innerText = location.address
            namePlaceholder.innerText = location.name
            phonePlaceholder.innerText = location.phoneNumber
            locationMenu.innerText = location.name
            cityStatePlaceholder.innerText = location.city + ", " + location.state
            generateSoonestAppt(location.locationId)
        }
    })
}

// The following function uses the location ID passed to it by 
// renderLocationInfo() to poll the DHS's API for Global Entry
// interview appointment slots.

// Right now, it just logs the appointment data to the console, but
// big things are coming! Pretty soon this humble function will be
// helping users all over the country find Global Entry appointment slots
// with ease.

let appointmentDay
let appointmentMonth
let appointmentYear
let appointmentDate
let appointmentDateForMachine
let appointmentDuration
let appointmentStartTime
let appointmentTimeData
let desiredDateStart
let desiredDateEnd

// converts the month in number to the month word src="https://codingbeautydev.com/blog/javascript-convert-month-number-to-name/#:~:text=To%20convert%20a%20month%20number%20to%20a%20month%20name%2C%20create,a%20specified%20locale%20and%20options.&text=Our%20getMonthName()%20function%20takes,the%20month%20with%20that%20position."
function getMonthName(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    monthWord = date.toLocaleString('en-US', { month: 'long' });
}

// TO DO: If we have extra time we can make the start time not in military time
function generateSoonestAppt(locationId) {
    fetch(`https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=1&locationId=${locationId}&minimum=1`)
    .then(response => response.json())
    .then(appointmentData => {
        let monthWord
        appointmentTimeData = appointmentData[0].startTimestamp
        appointmentDuration = appointmentData[0].duration
        appointmentStartTime = appointmentTimeData.slice(11)
        appointmentMonth = appointmentTimeData.substring(5,7)
        getMonthName(appointmentMonth)
        appointmentDay = appointmentTimeData.substring(8,10)
        appointmentYear = appointmentTimeData.substring(0,4)
        appointmentDate = `${appointmentDay} ${monthWord} ${appointmentYear}`
    })
}

// function generateApptInRange(locationId){
//     let monthWord
//     appointmentTimeData = appointmentData[0].startTimestamp
//     appointmentDuration = appointmentData[0].duration
//     appointmentStartTime = appointmentTimeData.slice(11)
//     appointmentMonth = appointmentTimeData.substring(5,7)
//     getMonthName(appointmentMonth)
//     appointmentDay = appointmentTimeData.substring(8,10)
//     appointmentYear = appointmentTimeData.substring(0,4)
//     appointmentDate = `${appointmentDay} ${monthWord} ${appointmentYear}`
//     fetch(`https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=1&locationId=${locationId}&minimum=1`)
//     .then(response => response.json())
//     .then(appointmentData => {
//         if (((`${appointmentYear}`) <= (desiredDateEndDate.substring(0, 5))) && ((`${appointmentYear}`) >= (desiredDateEndDate.substring(0, 5)))) {
//             console.log("Hi!")
//         }
//     })
// }

function generateApptInRange(locationId){
    fetch(`https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=1&locationId=${locationId}&minimum=1`)
    .then(response => response.json())
    .then(appointmentData => {
        let monthWord
        appointmentTimeData = appointmentData[0].startTimestamp
        appointmentDuration = appointmentData[0].duration
        appointmentStartTime = appointmentTimeData.slice(11)
        appointmentMonth = appointmentTimeData.substring(5,7)
        getMonthName(appointmentMonth)
        appointmentDay = appointmentTimeData.substring(8,10)
        appointmentYear = appointmentTimeData.substring(0,4)
        appointmentDate = `${appointmentDay} ${monthWord} ${appointmentYear}`
        appointmentDateForMachine = `${appointmentYear}-${appointmentMonth}-${appointmentDay}`
        console.log(typeof desiredDateEnd, desiredDateEnd)
        if ((Date.parse(appointmentDateForMachine) >= Date.parse(desiredDateStart)) && (Date.parse(desiredDateEnd) >= Date.parse(appointmentDateForMachine))){
            console.log("Succes!")
        } else {
            console.log(appointmentDateForMachine)
            console.log("Failure! :(")
        }
    })
}

// get today's date to populate the default value of the base picker

let today = new Date();
let dd = String(today.getDate()).padStart(2, '0');
let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = today.getFullYear();

today = `${yyyy}-${mm}-${dd}`

function datePicker() {
    let startDate = document.getElementById('startDate')
    let endDate = document.getElementById('endDate')
    startDate.value = `${today}`
    startDate.min = `${today}`
    endDate.value = `${today}`
    endDate.min = `${today}`
    let startDatepicker = document.getElementById('startDate');  
    startDatepicker.onchange = e => {
        e.preventDefault();
        desiredDateStart = e.target.value
        console.log(desiredDateStart)
        }  
    let endDatePicker = document.getElementById('endDate');
    endDatePicker.onchange = e => {
        e.preventDefault();
        desiredDateEnd = e.target.value
        console.log(desiredDateEnd)
        }
    }
