# Abbott Law College - Logo Change Guide

This guide explains how to change logos throughout the application.

## Logo Locations Overview

| Portal/Section | Current Logo | File Location | Config File(s) |
|----------------|--------------|---------------|----------------|
| Main Sidebar | Abbott Law College | `public/abbott-law-logo.svg` | `client/src/components/app-sidebar.tsx` |
| PBC Dashboard | Pakistan Bar Council | `attached_assets/pbc_logo_*.png` | `client/src/pages/dashboards/pbc-dashboard.tsx` |
| PBC Attendance Report | Pakistan Bar Council | `attached_assets/pbc_logo_*.png` | `client/src/pages/pbc/attendance-report.tsx` |
| Hazara Dashboard | Icon (no image) | - | `client/src/pages/dashboards/hazara-university-dashboard.tsx` |
| Hazara Attendance | Icon (no image) | - | `client/src/pages/hazara/attendance-report.tsx` |

---

## Step-by-Step Instructions

### 1. Changing the Main Sidebar Logo (Abbott Law College)

**Current location:** `public/abbott-law-logo.svg`

**Steps:**
1. Prepare your new logo (recommended: SVG or PNG, square format)
2. Place the new logo file in the `public/` folder
3. Open `client/src/components/app-sidebar.tsx`
4. Find this code (around line 413-417):
   ```tsx
   <img 
     src="/abbott-law-logo.svg" 
     alt="Abbott Law College" 
     className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain"
   />
   ```
5. Change the `src` to your new logo path:
   ```tsx
   src="/your-new-logo.png"
   ```
6. Save the file and restart the server

---

### 2. Changing the PBC Portal Logo (Pakistan Bar Council)

**Current location:** `attached_assets/pbc_logo_1766562305439.png`

**Files to update:**
- `client/src/pages/dashboards/pbc-dashboard.tsx`
- `client/src/pages/pbc/attendance-report.tsx`

**Steps:**
1. Place your new PBC logo in the `attached_assets/` folder
2. Open **both** files listed above
3. Find the import statement at the top:
   ```tsx
   import pbcLogo from "@assets/pbc_logo_1766562305439.png";
   ```
4. Change it to your new logo filename:
   ```tsx
   import pbcLogo from "@assets/your-new-pbc-logo.png";
   ```
5. Save both files and restart the server

---

### 3. Adding a Logo to Hazara University Portal

**Files to update:**
- `client/src/pages/dashboards/hazara-university-dashboard.tsx`
- `client/src/pages/hazara/attendance-report.tsx`

**Steps:**
1. Place your Hazara University logo in `attached_assets/` folder
2. Open the dashboard file: `client/src/pages/dashboards/hazara-university-dashboard.tsx`
3. Add import at the top of the file:
   ```tsx
   import hazaraLogo from "@assets/hazara-university-logo.png";
   ```
4. Find the header section with the icon (look for `Building` icon):
   ```tsx
   <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center">
     <Building className="h-10 w-10 text-white" />
   </div>
   ```
5. Replace it with:
   ```tsx
   <img src={hazaraLogo} alt="Hazara University" className="h-16 w-16 object-contain" />
   ```
6. Repeat steps 2-5 for the attendance report file
7. Save both files and restart the server

---

## Folder Structure

```
abbott-law-college/
├── public/                          # Public static assets
│   └── abbott-law-logo.svg          # Main sidebar logo
├── attached_assets/                 # Uploaded/attached assets
│   └── pbc_logo_1766562305439.png   # PBC portal logo
├── client/src/
│   ├── components/
│   │   └── app-sidebar.tsx          # Sidebar with main logo
│   └── pages/
│       ├── dashboards/
│       │   ├── pbc-dashboard.tsx         # PBC dashboard (has logo)
│       │   └── hazara-university-dashboard.tsx  # Hazara dashboard
│       ├── pbc/
│       │   └── attendance-report.tsx     # PBC attendance (has logo)
│       └── hazara/
│           └── attendance-report.tsx     # Hazara attendance
```

---

## Logo Recommendations

### Format
- **SVG** - Best for logos (scalable, small file size)
- **PNG** - Good alternative (use transparent background)
- **Avoid JPG** - No transparency support

### Size
- Recommended: 200x200 pixels minimum
- Square format works best
- The app will resize automatically using CSS

### File Naming
- Use lowercase letters
- Replace spaces with hyphens
- Examples: `hazara-logo.png`, `pbc-logo.svg`

---

## Quick Reference: Import Syntax

For logos in `public/` folder:
```tsx
<img src="/logo-name.png" alt="Description" />
```

For logos in `attached_assets/` folder:
```tsx
import myLogo from "@assets/logo-name.png";
// then use:
<img src={myLogo} alt="Description" />
```

---

## Troubleshooting

### Logo not appearing
- Check the file path is correct
- Ensure the file exists in the specified folder
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

### Logo appears stretched
- Use `object-contain` class to maintain aspect ratio
- Ensure your logo is square or adjust the container dimensions

### Import error
- Make sure the `@assets` path alias is configured in `vite.config.ts`
- Verify the filename matches exactly (case-sensitive)

---

## Support

For any issues, please contact the development team.
