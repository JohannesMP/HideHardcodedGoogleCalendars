# Overview
A **Tampermonkey** userscript for **Google Calendar** that simply removes **Birthdays** and **Tasks** from **My calendars**.

- It does this seamlessly and efficiently, only when the elements are redrawn or updated.
- It hides both Birthdays and Tasks from the My calendars list.
    - If you want to keep either of these you can comment them out in the script's **`--- Config ---`** section:
        <img width="518" height="307" alt="image" src="https://github.com/user-attachments/assets/3a60ca34-b02f-406c-b6f9-032d62139554" />


You can finally have more space for all of your exciting PTO and team meeting calendars!

# To Install
- Make sure you have the [Tampermonkey](https://www.tampermonkey.net/) browser extension installed, enabled, and the **Allow User Scripts** permission checked in its **Manage Extension** view (see [Troubleshooting](#troubleshooting)).
- Open the raw script from this repo: [/JohannesMP/HideHardcodedGoogleCalendars/raw/refs/heads/main/HideHardcodedGoogleCalendars.user.js](https://github.com/JohannesMP/HideHardcodedGoogleCalendars/raw/refs/heads/main/HideHardcodedGoogleCalendars.user.js)
    - If you have Tampermonkey enabled it should prompt you to install the script:
        <img width="616" height="335" alt="Tampermonkey install screen" src="https://github.com/user-attachments/assets/c492408c-d256-44eb-a1a2-409ec9cfd0dd" />

    - Alternatively you can past the script raw URL into the 'Import from URL' field in Tampermonkey's [Utilities tab](chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=utils):
        <img width="1016" height="368" alt="Tampermonkey utilities tab with import from url field selected" src="https://github.com/user-attachments/assets/cadd760d-bd56-4144-a131-09e40eb2f0e6" />


# Troubleshooting
- Make sure you you have have the tampermonkey extension installed and permissions enabled:
    <img width="651" height="761" alt="Tampermonkey settings" src="https://github.com/user-attachments/assets/ab78a19c-5636-4900-86da-1615b6d37c20" />

- If it looks like something broke please submit an [issue ticket](https://github.com/JohannesMP/HideHardcodedGoogleCalendars/edit/main/README.md)

-----

Last tested on **2026 / 02 / 24** with `Chrome 145.0.7632.109`
