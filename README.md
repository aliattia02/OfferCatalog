<div align="center">

# 🛒 Daily Deals — دليل العروض

> Egypt's daily deals & offer catalogue app — all the best offers, in one place.

Daily Deals is a bilingual **(Arabic / English)** mobile app for Egyptian shoppers that brings together weekly store flyers, promotional offers, and product catalogues from national and local retailers — so you never miss a deal.

[![Google Play](https://img.shields.io/badge/Google%20Play-Download-green?logo=google-play&style=flat-square)](https://play.google.com/store/apps/details?id=com.medlyticssolutions.dailydeals)
[![Version](https://img.shields.io/badge/version-1.0.8-blue?style=flat-square)]()
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey?style=flat-square)]()
[![Language](https://img.shields.io/badge/Language-Arabic%20%7C%20English-orange?style=flat-square)]()

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Screenshots](#-screenshots)
4. [Getting Started](#-getting-started)
5. [Feature Status](#-feature-status)
6. [License](#-license)

---

## 🗺️ Overview

Shoppers in Egypt have no single place to browse promotional catalogues from supermarkets, electronics stores, and retailers before heading out. **Daily Deals** fixes that — browse all active offers by category, filter by your city, build a shopping list, and never overpay again.

| | |
|---|---|
| **For shoppers** | Browse deals, save favourites, build a shopping list, and find nearby stores |
| **Categories** | Groceries · Electronics · Home Supplies · Fashion & Beauty |
| **Location** | Personalised by Governorate and City across Egypt |
| **Languages** | Full Arabic (RTL) and English support |

---

## ✨ Features

### 🏠 Home & Discovery
- Personalised home screen with featured offers grouped by category
- Location selector to show deals relevant to your city
- Quick category tiles: Groceries · Electronics · Home Supplies · Fashion & Beauty

### 📚 Catalogues & Flyers
- Browse all store flyers with **Active / Upcoming / Expired** status tabs
- Filter by store, category, and location
- Page-by-page flyer viewer with zoom and swipe navigation
- Save any catalogue page directly to your shopping basket

### 🔍 Search
- Search across catalogues, offers, stores, and categories all at once
- Tabbed results for easy browsing
- Smart Arabic text matching (handles diacritics and letter variants)

### 🛒 Shopping Basket
- Add individual offers or full catalogue pages to your basket
- Manage quantities per item
- Filter and sort your list by store or expiry date
- Auto-detects expired items and prompts for removal
- Total price shown in EGP
- Basket is saved between sessions

### ❤️ Favourites
- Favourite your go-to stores and product categories
- See all active catalogues from your favourite stores in one tab
- Browse grouped offers from your favourite categories with offer counts

### 🏪 Stores Directory
- Full list of national and local stores with logos and branch details
- Filter by store type and your location
- Store page includes address, opening hours, phone number, and an interactive map
- One-tap call or get directions to any branch

### 🔔 Notifications
- Get notified about new offers, expiring deals, and updates from favourite stores
- Fine-grained control — toggle each notification type on or off

### 👤 Account & Profile
- Sign in with **Google** or **email and password**
- Edit your name, phone number, and preferred location
- Language and notification settings all in one place

---

## 📸 Screenshots

> 📸 *Screenshots coming soon.*

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project (Firestore, Storage, Auth, FCM)
- Google OAuth credentials

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/aliattia02/OfferCatalog.git
cd OfferCatalog

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env   # fill in your Firebase credentials

# 4. Start the dev server
npm start
```

### Environment Variables

You'll need the following in your `.env` file — all values come from your Firebase project settings:

`EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

You'll also need to place your `google-services.json` (from Firebase Console) in the project root for Android builds.

---

## 🚦 Feature Status

| Status | |
|---|---|
| ✅ Live | Catalogues, offers, search, basket, favourites, store directory, notifications, Google sign-in, location personalisation, Arabic/English support |
| 🔜 Planned | iOS App Store release, more store partnerships, price tracking over time |

---

## 📄 License

Private — All rights reserved © Medlytics Solutions.

---

<div align="center">Built with ❤️ for Egyptian shoppers</div>
