# Tracking Script for TW Ortho

This repository contains a tracking script designed for TW Ortho's website, specifically for the [Request Appointment](https://www.twortho.com/contact-us/request-appointment/) page. The script collects and handles various tracking parameters and events to help analyze user interactions.

## Features

- **Initial Page Visit Data Collection**: Captures UTM parameters, referrer source, and visit type (initial or pageview).
- **Event Handling**: Tracks page views and form submissions.
- **Session Data Management**: Transfers session data to local storage upon page unload.
- **Form Data Handling**: Uses Fuse.js for fuzzy searching form field labels to extract user data.
- **Data Submission**: Sends collected data to a specified endpoint.

## Usage

To use the tracking script, include it in your HTML file:
