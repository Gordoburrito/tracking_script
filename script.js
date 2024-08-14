// Utility module for API calls
var APIModule = {
    baseUrl: 'https://api.threadcommunication.com',
    token: "unspecified_token!",

    init: function(token) {
        this.token = token;
    },

    post: async function(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': this.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.message) {
                console.warn(responseData.message);
            }
            console.log('Success:', responseData);
            return responseData;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};

// Module for tracking user activity
var TrackingModule = {
    init: function() {
        this.setupEventListeners();
        this.handlePageVisit();
    },

    setupEventListeners: function() {
        window.addEventListener('beforeunload', this.transferSessionToLocalStorage);
    },

    handlePageVisit: function() {
        this.handleEvent('pageview');
    },

    handleEvent: function (type) {
        try {
            var existingSessionData = JSON.parse(sessionStorage.getItem('sessionTrackingData')) || { sessionId: new Date().toISOString(), trackingParams: this.collectInitialPageVisitData(), events: {} };
            var timestamp = new Date().toISOString();
            existingSessionData.events[timestamp] = {
                type: type,
                date: timestamp,
            };
            sessionStorage.setItem('sessionTrackingData', JSON.stringify(existingSessionData));
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
                existingLocalData[sessionData.sessionId] = this.createSessionEntry(sessionData);
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

    createSessionEntry: function(sessionData) {
        return {
            sessionData: sessionData,
            sessionStart: sessionData.trackingParams.timestamp,
            sessionEnd: new Date().toISOString()
        };
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
    },

    getTrackingData: function() {
        const trackingHistory = JSON.parse(localStorage.getItem('trackingHistory') || '{}');
        const sessionHistory = JSON.parse(sessionStorage.getItem('sessionTrackingData'));
        if (sessionHistory) {
            trackingHistory[sessionHistory.sessionId] = this.createSessionEntry(sessionHistory);
        }
        return trackingHistory;
    }
};

// Module for handling telecom links (click-to-call, SMS)
// TODO: refactor to make this use the headers and use the practice instead of the website
var TelecomModule = {
    init: function() {
        document.body.addEventListener('click', this.handleTelecomLinkClick.bind(this));
    },

    handleTelecomLinkClick: async function(e) {
        const link = e.target.closest('a');
        if (!link) { return; }
        const hrefType = link.href.startsWith('tel:') ? 'tel' : link.href.startsWith('sms:') ? 'sms' : null;
        if (!hrefType) { return; }
        
        const trackingHistory = TrackingModule.getTrackingData();
        const params = {
            phone: link.href.replace(/^tel:|^sms:/, ''),
            trackingHistory: trackingHistory,
            href_type: hrefType,
            website: window.location.href
        };
        
        try {
            await APIModule.post('/api/v1/telecom_clicks', params);
        } catch (error) {
            console.error('Failed to log telecom click:', error);
        }
    }
};

// Module for form handling and submission
var FormModule = {
    init: function() {
        this.loadFuseJSAndSetupForms();
    },

    loadFuseJSAndSetupForms: function() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js';
        script.onload = () => this.setupFormHandling();
        document.head.appendChild(script);
    },

    setupFormHandling: function() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        });
    },

    handleFormSubmit: function(event) {
        event.preventDefault();
        TrackingModule.handleEvent('form_submission');
        this.processAndSubmitForm(event.target);
    },

    processAndSubmitForm: async function(form) {
        const formData = this.getFormDataArray(form);
        const fuzzyMatcher = this.createFuzzyMatcher(formData);
        const leadData = this.extractLeadData(fuzzyMatcher);
        const trackingHistory = TrackingModule.getTrackingData();
        const params = { ...leadData, trackingHistory: trackingHistory };

        try {
            await APIModule.post('/api/v1/website_leads', params);
        } catch (error) {
            console.error('New Lead not created in RG CRM.', error);
        }
    },

    getFormDataArray: function(form) {
        const formData = new FormData(form);
        return Array.from(formData.entries()).map(([key, value]) => {
            const field = form.querySelector(`[name="${key}"]`);
            const label = form.querySelector(`label[for="${field.id}"]`);
            let labelText = label ? label.textContent.trim() : key;
            labelText = this.cleanLabelText(labelText);
            return { key: labelText, value };
        });
    },

    cleanLabelText: function(text) {
        return text.replace(/[^a-zA-Z\s]/g, '')  // Remove non-alphabetic characters
                   .replace(/\s+/g, ' ')         // Normalize white spaces
                   .trim();                      // Trim leading/trailing spaces
    },

    createFuzzyMatcher: function(formDataArray) {
        const options = { includeScore: true, keys: ['key'] };
        const fuse = new Fuse(formDataArray, options);
        return searchKey => {
            const result = fuse.search(searchKey);
            return result.length ? result[0].item.value : null;
        };
    },

    extractLeadData: function(getFuzzyData) {
        return {
            first_name: getFuzzyData('Name'),
            last_name: getFuzzyData('Last'),
            email: getFuzzyData('Email'),
            phone: getFuzzyData('Phone')
        };
    }
};

// Main CRM object
var CRM = {
    init: function(config) {
        APIModule.init(config.token);
        TrackingModule.init();
        TelecomModule.init();
        FormModule.init();
    }
};

export { APIModule, TrackingModule, TelecomModule, FormModule, CRM }