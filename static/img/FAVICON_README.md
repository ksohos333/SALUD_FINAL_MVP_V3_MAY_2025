# Favicon Implementation Guide

This directory contains placeholder files for the website's favicon. To implement the actual favicon based on the orange logo with the "W" and "VOCAVICO" text, follow these steps:

## Required Files

The following files need to be replaced with actual image files:

1. `favicon.ico` - Multi-size ICO file (16x16, 32x32, 48x48)
2. `favicon-16x16.png` - 16x16 PNG version
3. `favicon-32x32.png` - 32x32 PNG version
4. `apple-touch-icon.png` - 180x180 PNG for iOS devices
5. `android-chrome-192x192.png` - 192x192 PNG for Android/Chrome
6. `android-chrome-512x512.png` - 512x512 PNG for Android/Chrome

## How to Create Favicon Files

1. Start with a high-resolution version of the logo (at least 512x512 pixels)
2. Use a tool like [Favicon Generator](https://realfavicongenerator.net/) or [Favicon.io](https://favicon.io/) to generate all required sizes
3. Replace the placeholder files in this directory with the generated files

## Implementation Details

The favicon references are already added to the `base.html` template:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="{{ url_for('static', filename='img/favicon.ico') }}">
<link rel="icon" type="image/png" sizes="16x16" href="{{ url_for('static', filename='img/favicon-16x16.png') }}">
<link rel="icon" type="image/png" sizes="32x32" href="{{ url_for('static', filename='img/favicon-32x32.png') }}">
<link rel="apple-touch-icon" sizes="180x180" href="{{ url_for('static', filename='img/apple-touch-icon.png') }}">
<link rel="manifest" href="{{ url_for('static', filename='site.webmanifest') }}">
<meta name="theme-color" content="#ff9800">
```

The `site.webmanifest` file is also already created at `static/site.webmanifest`.

## Design Guidelines

When creating the favicon files, follow these design guidelines:

1. Use the orange gradient background (#FF9800 to #FF8C00)
2. Include the stylized "W" in red
3. Make sure the design is recognizable even at small sizes
4. For larger sizes, you can include more details like the yellow dots and wavy lines
5. Keep the design consistent across all sizes

## Testing

After replacing the placeholder files, test the favicon in different browsers and devices to ensure it displays correctly.
