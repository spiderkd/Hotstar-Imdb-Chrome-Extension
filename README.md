# Hotstar IMDb & Rotten Tomatoes Ratings Extension

This Chrome extension shows **IMDb** and **Rotten Tomatoes** ratings directly below movie and series posters on **Disney+ Hotstar**.  
It fetches ratings from the [OMDb API](http://www.omdbapi.com/) and updates dynamically as you browse the site.

---

## ✨ Features
- ⭐ Shows **IMDb rating** for movies and series.
- 🍅 Optionally shows **Rotten Tomatoes rating** (if available).
- Automatically works for:
  - Featured hero images
  - Thumbnail images in lists or carousels
- Works with Hotstar’s **dynamic SPA content** (infinite scroll, lazy-loaded posters).
- Caches ratings locally to reduce API calls and speed up repeated views.

---

## 🖥️ Installation

1. **Get your OMDb API Key**  
   - Go to [OMDb API Key page](http://www.omdbapi.com/apikey.aspx) and request a free API key.

2. **Download or clone this repository**  
   - Contains `manifest.json`, `content.js`, and `styles.css`.

3. **Load the extension in Chrome**
   - Open Chrome → `chrome://extensions`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the folder containing the extension files

4. **Configure API Key**
   - Open `content.js`
   - Replace `YOUR_OMDB_KEY_HERE` with your OMDb API key

5. **Browse Hotstar**
   - Open [https://www.hotstar.com](https://www.hotstar.com)
   - Ratings will appear below movie and series posters automatically

---

## 🛠️ How It Works

1. **Poster Detection**
   - Uses `img[data-testid="image-element"][alt]` as selector
   - Reads the `alt` attribute for the movie/series title

2. **OMDb API Request**
   - Fetches ratings for that title using your API key
   - Supports both **IMDb** and **Rotten Tomatoes** ratings

3. **Badge Creation**
   - Inserts a small badge under the poster with ratings
   - Updates dynamically if the poster element is reused for another title

4. **Dynamic Updates**
   - Uses `MutationObserver` to detect new posters loaded by Hotstar’s infinite scroll
   - Uses `IntersectionObserver` and mouse hover events to fetch ratings for posters that appear later

5. **Caching**
   - Saves rating results in `localStorage` and memory
   - Reduces API calls and speeds up repeated views
   - Cached results expire after 7 days

---
## ⚠️ Notes
- Works only on **Disney+ Hotstar** (`*.hotstar.com`)
- OMDb free tier limits apply (~1000 requests/day)
- If Hotstar changes their site structure or poster `alt` attributes, the script may require updates
- Ratings may not appear instantly for newly loaded content; hover or scroll triggers loading

---

## 🛠️ Troubleshooting
- Check that your OMDb API key is correctly set in `content.js`
- Inspect the console (`F12` → Console tab) for errors
- If badges don’t appear for a new poster, try scrolling or hovering over the image

---

## 📜 License
This project is free and open source for personal use.

---
