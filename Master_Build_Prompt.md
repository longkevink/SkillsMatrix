# Master Build Prompt: Scheduling Tool (Next.js + Supabase)

## Context & Goal
You are building a **Resource Scheduling & Skills Matrix** web application. This is a Proof of Concept (POC) designed to replace fragmented spreadsheets used by production managers.

The core problem: Managers currently struggle to track which employees (Resources) are approved for which Shows/Control Rooms because data is scattered across multiple manual files. They need a **single, holistic dashboard** to instantly filter and find qualified staff.

**Important**: This POC must use **anonymized/dummy data** (e.g., "John Audio", "Steve TD"). Do not build real SSO or integrate with enterprise systems yet.

---

## Tech Stack
- **Frontend**: Next.js (React)
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (Clean, modern, information-dense UI)
- **Language**: TypeScript

---

## Database Schema (Supabase)
Create the following tables. Use UUIDs for primary keys.

1. **`resources`**
   - `id`: uuid, primary key
   - `name`: text (e.g., "John Audio")
   - `role`: text (e.g., "TD", "A1", "Stage Manager")
   - `created_at`: timestamp

2. **`shows`**
   - `id`: uuid, primary key
   - `name`: text (e.g., "Nightly News", "Today Show")
   - `type`: text (e.g., "Network", "News Now", "Control Room")
   - `created_at`: timestamp

3. **`resource_skills`** (Join Table)
   - `id`: uuid, primary key
   - `resource_id`: foreign key to `resources`
   - `show_id`: foreign key to `shows`
   - `status`: text (Enum: `Active`, `Refresh`, `Training`, `NA`, `Red`)
   - `notes`: text (Private notes, e.g., "Banned for reason X")
   - `updated_at`: timestamp

4. **`backfill_preferences`** (For ranked lists)
   - `id`: uuid, primary key
   - `show_id`: foreign key to `shows`
   - `resource_id`: foreign key to `resources`
   - `rank`: integer (1 = Top choice, 2 = Second choice, etc.)
   - `is_permanent_crew`: boolean (True if they are the main crew, False if they are backfill)

---

## Glossary of Terms & Roles

### People and Roles
- **TD**: Technical Director 
- **A1**: Audio Engineer / Audio Mixer / Production Mixer 
- **A2**: Helps mic up and assists the Audio Engineer 
- **SM**: Stage Manager 
- **Jib**: Camera operator who Operates a camera on a crane 
- **V1**: Video Operator / Video Engineer / can also do "Robo"
- **Robo**: Robotic Camera Operator 
- **TPM / TM**: Technical Production Manager / Tech Manager. The manager in the control room who oversees the production and staffing. 
- **VAP**: Voice Activated Prompter
- **Prompter**: Teleprompter Operator 
- **GFX Op**: Graphics Operator who controls all on screen graphics and in studio monitors
- **DPS / Tape**: Digital Playback services / Video playback operators. 
- **AD**: Associate Director who helps time and count the show to and from break 
- **Utility**: A technical associate who helps with physical tasks around a studio such as wrapping cables. Being an assist for a steadicam operator and other miscellaneous tasks related to live production 

### Shows and Assignments
- **TDY**: The Today Show 
	- Has 4 hours and two crews. One Crew Handles the 7am-9am shows and the second crew just does the 10am hour 
	- **4th Hour**: Another name for the 10am hour of The Today Show
- **NN**: Nightly News 
- **NNN**: NBC News Now - Digital first OTT network for NBC News
- **NND**: A show on NNN 
- **Top Story**: 7pm Hour of NNN
- **Stay Tuned**: 8pm hour of NNN

---

## MVP Features to Build

### 1. Data Seeding (Critical)
- Create a script/utility to populate the database with:
  - ~5 Resource Groups (TD, A1, etc.)
  - ~20 Dummy Resources per group.
  - ~10 Shows/Control Rooms.
  - Random distribution of skills (mostly `Active` or `NA`, with some `Red` and `Refresh`).

### 2. The Matrix Dashboard (Home)
- **Layout**: A dense grid view.
  - **Rows**: Resources (Grouped by Role).
  - **Columns**: Shows/Control Rooms.
  - **Cells**: Color-coded blocks based on `status`.
    - **Active**: Green
    - **Refresh**: Yellow (Needs training)
    - **Training**: Blue
    - **NA**: Grey/Empty
    - **Red**: Bright Red (Blocker)
- **Interactivity**: Clicking a cell should open a small modal/popover to edit the status and add a note.

### 3. Smart Filtering
- A sidebar or top bar with multi-select filters:
  - **Filter by Role**: "Show me only TDs".
  - **Filter by Capability**: "Show me resources who are [Active OR Refresh] for [Nightly News]".
  - **Search**: By Name.

### 4. Backfill View
- A dedicated page/view for a specific Show (e.g., "Nightly News Backfill").
- **Two Lists**:
  1. **Permanent Crew**: List of people assigned permanently.
  2. **Backup List**: An ordered list of preferred replacements.
- **Functionality**: Drag-and-drop to reorder the backup list (update `rank`).

---

## UX/UI Guidelines
- **Density**: This is a pro tool. Avoid excessive whitespace. Users want to see as much data as possible on one screen.
- **Clarity**: The difference between `Active` and `Red` must be instantly visible (high contrast).
- **Speed**: Filtering should feel instant.

## Step-by-Step Implementation Plan
1. **Initialize Project**: Set up Next.js + Tailwind + Supabase client.
2. **DB Setup**: create tables and run the seed script.
3. **Build API/Queries**: Fetch resources with their skills joined.
4. **Build Dashboard**: Create the Matrix Grid component.
5. **Add Filters**: Implement client-side filtering for the grid.
6. **Build Backfill View**: Create the drag-and-drop list interface.

Start by setting up the Database structure and the Seeding script.