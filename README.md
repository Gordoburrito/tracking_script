# Tracking Script for the CRM

This repository contains a tracking script designed for TW Ortho's website, specifically for the [Request Appointment](https://www.twortho.com/contact-us/request-appointment/) page. The script collects and handles various tracking parameters and events to help analyze user interactions.

## Features

- **Initial Page Visit Data Collection**: Captures UTM parameters, referrer source, and visit type (initial or pageview).
- **Event Handling**: Tracks page views and form submissions.
- **Session Data Management**: Transfers session data to local storage upon page unload.
- **Form Data Handling**: Uses Fuse.js for fuzzy searching form field labels to extract user data.
- **Data Submission**: Sends collected data to a specified endpoint.

## Usage

To use the tracking script, include it in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/gh/roostergrin/crm_frontend_integration/script.js"></script>
<script type="text/javascript">
    CRM.init({
        token: "your_authorization_key_here"
    });
</script>
```
To use in staging or locally 

```html
<!-- For production -->
<script>
CRM.init({
    token: 'your_production_token_here',
    baseUrl: 'https://api.threadcommunication.com'
});
</script>

<!-- For staging -->
<script>
CRM.init({
    token: 'your_staging_token_here',
    baseUrl: 'https://staging-api.threadcommunication.com'
});
</script>

<!-- For local development -->
<script>
CRM.init({
    token: 'your_dev_token_here',
    baseUrl: 'http://localhost:3000'
});
</script>
```


## Additional Information
For more information on how to use jsDelivr to load GitHub releases, commits, or branches, visit [jsDelivr Documentation](https://www.jsdelivr.com/?docs=gh).

### My update didn't go through!! 😤
is your tag EXACTLY vX.X.X ? 
you can always purge the cache by visiting the url 
`https://purge.jsdelivr.net/gh/roostergrin/crm_frontend_integration/script.js` 


### Nuxt
```
    script: [
      {
        src: 'https://cdn.jsdelivr.net/gh/roostergrin/crm_frontend_integration@latest/script.js'
      },
      {
        hid: 'crm-init',
        innerHTML: `
          CRM.init({
              token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcmlnaW4iOiJodHRwczovL2NybS10aHJlYWQucm9vc3RlcmdyaW50ZW1wbGF0ZXMuY29tLyIsInByYWN0aWNlX2lkIjoiMzU1In0.aUzwgQdETpNeY42CoQNYNSTiVJ23zKIL2I1e6bDRNqI"
          });
        `,
        type: 'text/javascript'
      }
    ],
    __dangerouslyDisableSanitizersByTagID: {
      'crm-init': ['innerHTML']
    }
```
