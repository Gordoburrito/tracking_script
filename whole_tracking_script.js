

// https://cdn.jsdelivr.net/gh/roostergrin/tracking_script@1.0.0/whole_tracking_script.js

// For Twortho
// https://www.twortho.com/contact-us/request-appointment/

// Function to collect initial tracking parameters
function collectInitialPageVisitData() {
  var url = document.referrer
  var source = url
    ? new URL(url).hostname.split('.').slice(-2, -1)[0]
    : 'Direct or no-referrer'
  var isFirstVisit = !localStorage.getItem('hasVisitedBefore')
  var urlParams = new URLSearchParams(window.location.search)
  var timestamp = new Date().toISOString()

  if (isFirstVisit) localStorage.setItem('hasVisitedBefore', 'true')

  return {
    type: isFirstVisit ? 'initial_visit' : 'pageview',
    source: urlParams.get('utm_source') || 'N/A',
    medium: urlParams.get('utm_medium') || 'N/A',
    campaign: urlParams.get('utm_campaign') || 'N/A',
    term: urlParams.get('utm_term') || 'N/A',
    content: urlParams.get('utm_content') || 'N/A',
    referrerSource: source,
    timestamp: timestamp,
  }
}

// Function to handle a new event
function handleEvent(type) {
  try {
    var existingSessionData = JSON.parse(sessionStorage.getItem('sessionTrackingData')) || { sessionId: new Date().toISOString(), trackingParams: collectInitialPageVisitData(), events: {} }

    var timestamp = new Date().toISOString()
    existingSessionData.events[timestamp] = {
      type: type,
      date: timestamp,
    }

    sessionStorage.setItem('sessionTrackingData', JSON.stringify(existingSessionData))
  } catch (error) {
    console.error('Failed to handle event:', error)
  }
}

// Function to transfer data from sessionStorage to localStorage
function transferSessionToLocalStorage() {
  try {
    var sessionData = JSON.parse(sessionStorage.getItem('sessionTrackingData'))
    if (sessionData) {
      var existingLocalData = JSON.parse(localStorage.getItem('trackingHistory')) || []
      existingLocalData[sessionData.sessionId] = sessionData
      localStorage.setItem('trackingHistory', JSON.stringify(existingLocalData))
    }
    sessionStorage.removeItem('sessionTrackingData')
  } catch (error) {
    console.error('Failed to transfer session data:', error)
  }
}


// Event handlers
function handlePageVisit() {
  handleEvent('pageview');
}

function handleFormSubmit(event) {
  handleEvent('form_submission');
}

// Attach event listeners
window.addEventListener('load', handlePageVisit);
window.addEventListener('beforeunload', function () {
  transferSessionToLocalStorage();
});

document.addEventListener('DOMContentLoaded', function () {
    // Dynamically load Fuse.js
    const fuseScript = document.createElement('script');
    fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js';
    fuseScript.onload = function () {
        // Fuse.js is now loaded and can be used
        initializeFormHandling();
    };
    document.head.appendChild(fuseScript);
});

document.addEventListener('DOMContentLoaded', function () {
    // Get all forms on the page
    const forms = document.querySelectorAll('form');

    forms.forEach(function (form) {
        form.addEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', async function (event) { 
            event.preventDefault(); // Prevent the default form submission

            // Create a new FormData object from the form
            const formData = new FormData(form);

            // Create an array from formData keys and values, mapping keys to cleaned form labels
            const formDataArray = Array.from(formData.entries()).map(([key, value]) => {
                const field = form.querySelector(`[name="${key}"]`);
                const label = form.querySelector(`label[for="${field.id}"]`);
                let labelText = label ? label.textContent.trim() : key; // Use label text or key as fallback
                labelText = labelText.replace(/[^a-zA-Z\s]/g, ''); // Remove non-alphabetic characters
                labelText = labelText.replace(/\s+/g, ' ').trim(); // Normalize white spaces and trim
                return { key: labelText, value };
            });
            console.log("formDataArray", formDataArray)

            // Define options for Fuse.js
            const options = {
                includeScore: true,
                keys: ['key'] // Use 'key' because we are now using label text as key in formDataArray
            };

            // Create a Fuse instance
            const fuse = new Fuse(formDataArray, options);

            // Define a function to search and get data by fuzzy key name
            function getFuzzyData(searchKey) {
                const result = fuse.search(searchKey);
                return result.length ? result[0].item.value : null;
            }

            // Use getFuzzyData to fetch form data by fuzzy searching keys
            const firstName = getFuzzyData('Name');
            const lastName = getFuzzyData('Last');
            const email = getFuzzyData('Email');
            const phone = getFuzzyData('Phone');

            // Log form data to console
            console.log('Form Data:');
            for (let [key, value] of formData.entries()) {
              console.log(`${key}: ${value}`);
            }

            // Retrieve data from local storage and log it to console
            console.log('Local Storage Data:');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                console.log(`${key}: ${value}`);
            }

          try {
            console.log("firstName", firstName)
            console.log("lastName", lastName)
            console.log("email", email)
            console.log("phone", phone)
          // TODO: Add the following back in
          
            const trackingData = JSON.parse(sessionStorage.getItem('sessionTrackingData'))?.trackingParams
            const referrerSource = trackingData?.referrerSource
            const utmSource = trackingData?.source
            const campaign = trackingData?.campaign
            const baseUrl = 'https://mammoth-deep-ape.ngrok-free.app'

            console.log("trackingData", trackingData)
            debugger

            const response = await fetch(`${baseUrl}/api/v1/website_leads`, {
              method: 'POST',
              headers: {
                  'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcmlnaW4iOiJodHRwczovL2NybS10aHJlYWQucm9vc3RlcmdyaW50ZW1wbGF0ZXMuY29tLyIsInByYWN0aWNlX2lkIjoiMzU1In0.aUzwgQdETpNeY42CoQNYNSTiVJ23zKIL2I1e6bDRNqI',
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
                  phone: phone,
                  referrer_source: referrerSource,
                  utm_source: utmSource,
                  campaign_name: campaign
              })
            });

            const responseData = await response.json();
            if (responseData.message) {
                console.warn(responseData.message);
            }
          } catch (error) {
            console.error('New Lead not created in RG CRM.', error);
          }
            // Pause execution to keep the console log on the screen
        });
    });
});