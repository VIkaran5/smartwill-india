# SmartWill India — 8-Week Automated Content Schedule

This directory contains the automated content engine for SmartWill India.
The cloud engine automatically rotates through these **8 distinct legal themes** every Tuesday & Thursday @ 8:00 PM IST directly to your Telegram bot.

---

## 📅 The 8-Week Rotating Calendar

| Week | Theme | Tuesday (Quora) | Thursday (X / Twitter) |
| :---: | :--- | :--- | :--- |
| **Week 1** | **Plain Paper Validity** | Can a Will be written on plain paper in India? | 5 Dangerous myths about Indian Wills |
| **Week 2** | **Nominee vs Legal Heir** | Difference between Nominee & Legal Heir | The Nominee Trap in Indian Banking |
| **Week 3** | **NRI Cross-Border Succession** | Can an NRI make an Indian Will from abroad? | Foreign Wills vs Indian Flat Probate |
| **Week 4** | **RBI Unclaimed ₹40,000 Cr** | What happens to bank accounts without a Will? | How ₹40k Cr gets stuck in RBI DEA fund |
| **Week 5** | **Demat & Mutual Funds** | How mutual funds & shares are inherited | What happens to Zerodha/Groww portfolios |
| **Week 6** | **Will Registration Myth** | Is Will registration mandatory in India? | The ₹20,000 Advocate Registration Myth |
| **Week 7** | **Daughters' Property Rights** | Do married daughters have equal rights in property? | Self-acquired property vs Coparcenary |
| **Week 8** | **The 2-Witness Rule** | Who can be a witness to an Indian Will? | The #1 mistake that makes a Will void in court |

---

## ⚙️ How the Automation Works
1. **Cloud Runner**: GitHub Actions runs `.github/workflows/weekly-content.yml` 24/7/365.
2. **Weekly Rotation**: Every Monday 00:00 UTC, the system automatically advances to the next week (Week 1 ➔ Week 2 ➔ ... ➔ Week 8 ➔ Week 1).
3. **Tuesday 8:00 PM IST**: Sends the active week's Quora question, clickable direct question link, and verified answer.
4. **Thursday 8:00 PM IST**: Sends the active week's viral X (Twitter) thread with hashtags.
5. **Data Source**: Full content definitions are stored in [`marketing/content_bank.json`](file:///c:/Users/dasar/OneDrive/Documents/New%20folder/smartwill-india/marketing/content_bank.json).
