const body = document.body;
const selectEl = document.querySelector("select[name=country]");
const addEntryForm = document.querySelector(".add-entry-form");
const errorText = document.querySelector(".error-text");
const leaderboardEl = document.querySelector(".leaderboard");
const yearEl = document.querySelector("#year");

// Global records
const leaderboardArr = [];
let leaderboardEntryIds = {};

// Height of each displayed record and gap between records
let RECORD_HEIGHT = 88;
const RECORD_GAP = 4;

const MAX_ALLOWED_SCORE = 100;
const MIN_ALLOWED_SCORE = 0;

body.onload = () => {
    handleResizeScreen();
    getCountryList();
    yearEl.innerHTML = new Date().getFullYear();

    window.addEventListener("resize", handleResizeScreen);

    addEntryForm.addEventListener("submit", submitEntry);

    // Get leaderboard array and ids object from localStorage into our global records and display entries
    const arrayInStorage = JSON.parse(localStorage.getItem("leaderboard"));
    const arrayIdsInStorage = JSON.parse(localStorage.getItem("leaderboard_ids"));

    // Check that they're not null before using them, just in case they don't already exist in localstorage
    // Like in the case of the first time this app will run in a browser
    if (arrayInStorage) {
        leaderboardArr.push(...arrayInStorage);
        displayLeaderboard();
    }

    if (arrayIdsInStorage) {
        leaderboardEntryIds = {...arrayIdsInStorage};
    }
}


// HANDLERS

// Handle submit form to add new record
function submitEntry(e) {
    e.preventDefault();

    const inputsData = getAllInputsData();

    if (!inputsData) {
        errorText.innerHTML = "All fields are required";
        return;
    }

    errorText.innerHTML = "";
    addRecordToLeaderboard(inputsData);
}

// Updates the score in the record of the clicked button
function updatePlayerScore(e, valueChange) {
    const index = e.currentTarget.dataset.index;
    
    const newScore = leaderboardArr[index].score + valueChange;

    if (newScore <= MAX_ALLOWED_SCORE && newScore >= MIN_ALLOWED_SCORE) {
        leaderboardArr[index].score += valueChange;
        leaderboardArr[index].time = getTime();

        sortLeaderboard();

        // The reason for the setTimeout here is explained in the addEntryToLeaderboard function in LEADERBOARD UTILITIES
        setTimeout(() => {
            updateLeaderboard();
        }, 0);
    }
}

// Deletes the record of the clicked button
function deletePlayerEntry(e) {
    const target = e.currentTarget;
    const index = target.dataset.index;

    // Remove the entry at that index from the global leaderboard array
    leaderboardArr.splice(index, 1);

    // Delete that id from the global object of existing record ids and update localstorage for leaderboard_ids
    delete leaderboardEntryIds[target.dataset.id];
    localStorage.setItem("leaderboard_ids", JSON.stringify(leaderboardEntryIds));

    sortLeaderboard();

    // The reason for the setTimeout here is explained in the addEntryToLeaderboard function in LEADERBOARD UTILITIES
    setTimeout(() => {
        updateLeaderboard();
    }, 0);
}

// Handles changing RECORD_HEIGHT depending on screen size
function handleResizeScreen() {
    const screenWidth = window.innerWidth;
    const MOBILE_RECORD_HEIGHT = 160;
    const DESKTOP_RECORD_HEIGHT = 88;
    
    RECORD_HEIGHT = screenWidth < 768 ? MOBILE_RECORD_HEIGHT : DESKTOP_RECORD_HEIGHT;
    
    if (leaderboardArr.length) {
        updateLeaderboard();
    }
}


// HELPERS

// Returns `false` if all inputs data are not complete or an object containing all inputs data
function getAllInputsData() {
    const inputsArr = addEntryForm.querySelectorAll("[name]");
    const inputData = {};
    let inputsAreOkay = true;

    for (let input of inputsArr) {
        if (input.value) {
            inputData[input.name] = input.value.toUpperCase();
        } else {
            inputsAreOkay = false;
            break;
        }
    }

    return inputsAreOkay && inputData;
}

// Returns a unique id for a new record
function createId() {
    // Create a string of 6 random numbers;
    let randomNum = String(Math.random()).slice(-6);

    // If that string exists in the global id store, create another... 
    // ...until you get one that is unique in the store
    while(leaderboardEntryIds[randomNum]) {
        randomNum = String(Math.random()).slice(-6);
    }

    // Set that id in the global id store as a property and update leaderboard_ids in localStorage
    leaderboardEntryIds[randomNum] = true;
    localStorage.setItem("leaderboard_ids", JSON.stringify(leaderboardEntryIds));

    return randomNum;
}

// Returns current time formatted in a particular way
function getTime() {
    const now = new Date();
    const date = now.toLocaleString("en-us", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
    const time = now.toLocaleString("en-gb", { timeStyle: "short" });

    return date + " " + time;
}

// This recieves parameters and returns the html for a record to be displayed on screen
// Records are absolutely placed so the `top` parameter is used to determine its position
// relative to its parent.

// The `record` class has transition stylings in it so changing the top values of the records accurately
// will result in the records appearing to smoothly reorganise themselves

// Also note that the functions in the three buttons have `event` passed to them. 
// It must be written exactly like that to be able to access that event in the described function.
function createRecordDisplayFromTemplate({id, top, name, time, country, score, index}) {
    return `
        <div class="record" id="${id}" style="top: ${top}px;">
            <div class="grid gap-2 area-a">
                <span class="name uppercase">${name}</span>
                <span class="time text-xs text-black/40">${time}</span>
            </div>
            <div class="overflow-hidden area-b">
                <p class="country truncate">${country}</p>
            </div>
            <div class="area-c">
                <span class="score">${score}</span>
            </div>
            <div class="w-full h-full flex flex-col-reverse justify-between md:flex-row md:justify-start items-center gap-1 area-d">
                <div class="btn delete" data-index="${index}" data-id="${id}" onclick="deletePlayerEntry(event);">
                    <span class="text-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
                            <path fill="currentColor" fill-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zM9 2H6v1h3zM4 13h7V4H4zm2-8H5v7h1zm1 0h1v7H7zm2 0h1v7H9z" clip-rule="evenodd"/>
                        </svg>
                    </span>
                </div>
                <div class="btn plus" data-index="${index}" onclick="updatePlayerScore(event, 5);">
                    +5
                </div>
                <div class="btn minus" data-index="${index}" onclick="updatePlayerScore(event, -5);">
                    -5
                </div>
            </div>
        </div>
    `;
}


// LEADERBOARD UTILITIES

// Handles creation of record, related processes and clears form at the end
function addRecordToLeaderboard(obj) {
    const record = {
        id: createId(),
        name: `${obj.firstName} ${obj.lastName}`,
        country: obj.country,
        score: Math.round(Number(obj.score)),
        time: getTime()
    };

    addSingleRecordToLeaderboardDisplay(record);
    sortLeaderboard();
    addEntryForm.reset();

    // The setTimeout used before updateLeaderboard is called here anywhere is to 
    // make it possible for the transition to be visible.

    // Since setTimeout forces updateLeaderboard() to run only after executing all available synchronous code,
    // any previous changes to the DOM will first register, 
    // Then updateLeaderboard() will run, and make further changes to the DOM, and transitions can show up
    setTimeout(() => {
        updateLeaderboard();
    }, 0);
}

// Handles sorting of the global leaderboard array based on player scores
// and updates leaderboard wrapper height as well as localStorage
function sortLeaderboard() {
    const LENGTH = leaderboardArr.length;
    const wrapHeight = `${(RECORD_HEIGHT * LENGTH) + (RECORD_GAP * (LENGTH - 1))}px`;
    leaderboardEl.style.height = wrapHeight;

    leaderboardArr.sort((a,b) => b.score - a.score);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboardArr));
}

// This is only called onload if there are leaderboard entries stored in localstorage
function displayLeaderboard() {
    let records = "";

    // Calculate height of the leaderboard display wrapper since its children are absolutely
    // positioned and it cannot depend on them for a height
    const LENGTH = leaderboardArr.length;
    const wrapHeight = `${(RECORD_HEIGHT * LENGTH) + (RECORD_GAP * (LENGTH - 1))}px`;
    leaderboardEl.style.height = wrapHeight;

    // For each record available, call the display creating function with the necessary parameters
    // to generate the html for the record and add to the records variable
    for (let i = 0; i < leaderboardArr.length; i++) {
        records += createRecordDisplayFromTemplate({
            id: leaderboardArr[i].id,
            top: (RECORD_HEIGHT + RECORD_GAP) * i,
            name: leaderboardArr[i].name,
            time: leaderboardArr[i].time,
            country: leaderboardArr[i].country,
            score: leaderboardArr[i].score,
            index: i,
        });
    }

    leaderboardEl.innerHTML = records;
}

// This adds a single entry to the display after the form is filled.
// It merely adds the html for that record to the end of the contents of the leaderboard display
// And then pushes the recieved object into the global leaderboard array
function addSingleRecordToLeaderboardDisplay(obj) {
    const LENGTH = leaderboardArr.length;

    leaderboardEl.innerHTML += createRecordDisplayFromTemplate({
        id: obj.id,
        top: (RECORD_HEIGHT + RECORD_GAP) * LENGTH,
        name: obj.name,
        time: obj.time,
        country: obj.country,
        score: obj.score,
        index: LENGTH,
    });

    leaderboardArr.push(obj);
}

// This function is responsible for updating the html of the records AFTER they have been displayed on screen
function updateLeaderboard() {
    // Get all displayed records in the document and create a hashtable to temporarily store them
    const records = document.querySelectorAll('.record');
    const recordsObj = {};

    for (let i = 0; i < records.length; i++) {
        const id = records[i].id;
        const entryExistsInLeaderboard = leaderboardEntryIds[id];

        // If the id of any record is not present in our global object of record ids,
        // Then that record has been deleted from the array, so remove it from the html
        if(!entryExistsInLeaderboard) {
            leaderboardEl.removeChild(records[i]);
            continue;
        }
        recordsObj[records[i].id] = records[i];
    }

    // Now we loop over the global leaderboard array and use the values there to update the html of each record
    // with its current values
    for (let i = 0; i < leaderboardArr.length; i++) {
        // Get record id and use that to get the html element for that record from the hashmap created earlier
        const recordId = leaderboardArr[i].id;
        const record = recordsObj[recordId];
        
        if (record) {
            record.style.top = `${(RECORD_HEIGHT + RECORD_GAP) * i}px`;
            const plusBtn = record.querySelector(".btn.plus");
            const minusBtn = record.querySelector(".btn.minus");
            const deleteBtn = record.querySelector(".btn.delete");
            const timeEl = record.querySelector(".time");
            const scoreEl = record.querySelector(".score");

            timeEl.innerHTML = leaderboardArr[i].time;
            scoreEl.innerHTML = leaderboardArr[i].score;

            plusBtn.dataset.index = i;
            minusBtn.dataset.index = i;
            deleteBtn.dataset.index = i;
        }
    }
}


// FETCHERS ??🤷‍♀️😂
async function getCountryList() {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
        const data = await response.json();
        const countries = data.map(country => country.name.common).sort();

        let optionList = "";
        for (let country of countries) {
            optionList += `<option value="${country}">${country}</option>`
        }

        selectEl.innerHTML += optionList;
    } catch (err) {
        console.error({err})
    }
}

// function getCountryList() {
//     fetch("https://restcountries.com/v3.1/all?fields=name")
//         .then((response) => response.json())
//         .then((data) => console.log({data}))
//         .catch((err) => console.error({err}));
// }