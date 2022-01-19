// Database variable
let db;

// Create 'budget' database
const request = indexedDB.open('budget', 1);

// If upgrade needed for IndexedDB
request.onupgradeneeded = function (event) {
    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;
    console.log(`DB updated from version ${oldVersion} to ${newVersion}`);
    db = event.target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('budgetStore', { autoIncrement: true });
    }
};

// If request error
request.onerror = function (event) {
    console.log(`Error: ${event.target.errorCode}`);
};

// If request success
request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        console.log('Online and reading from DB');
        checkDatabase();
    }
};

function checkDatabase() {
    // Open transaction on budgetStore DB
    let transaction = db.transaction(['budgetStore'], 'readwrite');
    // Access budgetStore object
    const store = transaction.objectStore('budgetStore');
    // Get all records from store
    const getAll = store.getAll();
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            },
        })
        .then((response) => response.json())
        .then((res) => {
            if (res.length !== 0) {
                transaction = db.transaction(['budgetStore'], 'readwrite');
                // Assign current store to variable
                const currentStore = transaction.objectStore('budgetStore');
                currentStore.clear();
                }
            });
        }
    };
}

// Saves if user goes offline
const saveRecord = (record) => {
    const transaction = db.transaction(['budgetStore'], 'readwrite');
    const store = transaction.objectStore('budgetStore');
    store.add(record);
};

// Calls checkDatbase function if user goes back online
window.addEventListener('online', checkDatabase);