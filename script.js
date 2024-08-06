// For https://www.twortho.com/

var CRM = {
    init: function (config) {
        this.token = config.token; // Store the authorization key
        this.setupEventListeners(); // Setup event listeners after initialization
        this.loadExternalScripts(); // Load external scripts like Fuse.js
    },

    setupEventListeners: function() {
        this.handlePageVisit();
        window.addEventListener('beforeunload', () => {
            this.transferSessionToLocalStorage();
        });
        document.addEventListener('DOMContentLoaded', () => {
            document.body.addEventListener('click', this.handleTelecomLinkClick.bind(this));
            this.setupFormHandling.bind(this)();
        });
    },

    loadExternalScripts: function() {
        const fuseScript = document.createElement('script');
        fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js';
        fuseScript.onload = () => {
            this.setupFormHandling();
        };
        document.head.appendChild(fuseScript);
    },

    handlePageVisit: function () {
        this.handleEvent('pageview');
    },

    handleFormSubmit: function(event) {
        event.preventDefault(); // Prevent the default form submission
        this.handleEvent('form_submission');
    },

    handleEvent: function(type) {
        console.log('handleEvent', type);
        console.log("initial sessionTrackingData", sessionStorage.getItem('sessionTrackingData'));
        try {
            var existingSessionData = JSON.parse(sessionStorage.getItem('sessionTrackingData')) || { sessionId: new Date().toISOString(), trackingParams: this.collectInitialPageVisitData(), events: {} };
            var timestamp = new Date().toISOString();
            existingSessionData.events[timestamp] = {
                type: type,
                date: timestamp,
            };
            sessionStorage.setItem('sessionTrackingData', JSON.stringify(existingSessionData));
            console.log('sessionTrackingData', sessionStorage.getItem('sessionTrackingData'));
        } catch (error) {
            console.error('Failed to handle event:', error);
        }
    },

    transferSessionToLocalStorage: function() {
        try {
            const sessionData = JSON.parse(sessionStorage.getItem('sessionTrackingData'))
            if (sessionData) {
                let existingLocalData = JSON.parse(localStorage.getItem('trackingHistory'))
                if (!existingLocalData || Array.isArray(existingLocalData)) {
                    existingLocalData = {}
                }
                existingLocalData[sessionData.sessionId] = { sessionData, sessionStart: sessionData.trackingParams.timestamp, sessionEnd: new Date().toISOString() }
                localStorage.setItem(
                    'trackingHistory',
                    JSON.stringify(existingLocalData)
                )
            }
            sessionStorage.removeItem('sessionTrackingData')
        }
        catch (error) {
            console.error('Failed to transfer session data:', error)
        }
    },

    handleTelecomLinkClick: async function(e) {
        const link = e.target.closest('a');
        if (!link) { return; }
        const hrefType = link.href.startsWith('tel:') ? 'tel' : link.href.startsWith('sms:') ? 'sms' : null;
        if (!hrefType) { return; }
        const postUrl = 'https://api.threadcommunication.com/api/v1/tracking';
        const sessionData = sessionStorage.getItem('sessionTrackingData');
        const trackingData = sessionData ? JSON.parse(sessionData).trackingParams : {};
        const { referrerSource, source: utmSource, campaign } = trackingData;
        const params = {
            phoneNumber: link.href.replace(/^tel:|^sms:/, ''),
            time: new Date().toISOString(),
            website: window.location.href,
            referrer_source: referrerSource,
            utm_source: utmSource,
            campaign_name: campaign,
            href_type: hrefType
        };
        try {
            const response = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params).toString()
            });
            const data = await response.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    },

    setupFormHandling: function() {
        const forms = document.querySelectorAll('form');
        forms.forEach((form) => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
            form.addEventListener('submit', this.processAndSubmitForm.bind(this));
        });
    },

    processAndSubmitForm: async function(event) {
        event.preventDefault(); // Prevent the default form submission

        const form = event.target;
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

        let trackingData;
        this.transferSessionToLocalStorage();
        var trackingHistory = localStorage.getItem('trackingHistory');
        if (trackingHistory) {
            var trackingHistory = JSON.parse(trackingHistory);
            var firstKey = Object.keys(trackingHistory)[0];
            var firstElement = trackingHistory[firstKey];
        }

        if (firstElement) {
            trackingData = firstElement.sessionData.trackingParams;
        } else {
            trackingData = {
                referrerSource: null,
                source: null,
                campaign: null
            };
        }

        const { referrerSource, source: utmSource, campaign } = trackingData;

        const baseUrl = 'https://api.threadcommunication.com';
        const token = this.token || 'default_key_if_not_provided'; // Use the token from the CRM object
        console.log(firstName, lastName, email, phone, referrerSource, utmSource, campaign);
        try {
            const response = await fetch(`${baseUrl}/api/v1/website_leads`, {
                method: 'POST',
                headers: {
                    'Authorization': token, // Use the passed authorization key
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
            console.log("Success:", responseData);
        } catch (error) {
            console.error('New Lead not created in RG CRM.', error);
        }
    },

    collectInitialPageVisitData: function() {
        var url = document.referrer;
        var source = url ? new URL(url).hostname.split('.').slice(-2, -1)[0] : 'Direct or no-referrer';
        var isFirstVisit = !localStorage.getItem('hasVisitedBefore');
        var urlParams = new URLSearchParams(window.location.search);
        var timestamp = new Date().toISOString();
        if (isFirstVisit) localStorage.setItem('hasVisitedBefore', 'true');
        return {
            type: isFirstVisit ? 'initial_visit' : 'pageview',
            source: urlParams.get('utm_source') || 'N/A',
            medium: urlParams.get('utm_medium') || 'N/A',
            campaign: urlParams.get('utm_campaign') || 'N/A',
            term: urlParams.get('utm_term') || 'N/A',
            content: urlParams.get('utm_content') || 'N/A',
            referrerSource: source,
            timestamp: timestamp,
        };
    }
};