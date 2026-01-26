# MYPA iOS App - React Native Expo

## Overview
This is a React Native mobile app built with Expo, designed as an iOS-style personal assistant application. The app runs on web, iOS, and Android platforms.

## Project Architecture
- **Framework**: React Native with Expo SDK 52
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Icons**: @expo/vector-icons (Ionicons, MaterialCommunityIcons, Feather)
- **Bundler**: Metro (Expo's bundler)
- **Port**: 5000 (web preview)

## Key Screens
### Main Screens (Tab Navigation)
- **Hub (Home)**: Main dashboard with streak tracker, quick actions, and cards for Plan, Tasks, Challenges, Circles, Wallet, Settings
- **Plan**: Daily schedule with interactive task timeline, day selector, and progress tracking
- **Profile**: User profile with achievements, level progress, stats, and account settings
- **Circles**: Social groups with activity tracking and member counts

### Sub-Screens (Stack Navigation from Hub)
- **Wallet**: Balance display, transactions history, send/receive/redeem actions
- **Challenges**: Active and available challenges with progress tracking and rewards
- **Settings**: App preferences, account settings, and support options
- **Tasks**: Task management with priority filtering and completion tracking
- **Streak**: Streak tracking with calendar view, milestones, and XP multiplier benefits
- **Level**: XP progression, rank tiers, recent XP history, and level rewards

### Sub-Screens (Stack Navigation from Profile)
- **EditProfile**: User account management with avatar, name, bio, contact info, password change
- **Notifications**: Granular notification controls for task reminders, circles, challenges, quiet hours
- **PrivacyControls**: Privacy modes (private/metrics/proof), per-circle settings, data permissions
- **HelpSupport**: FAQs, contact forms (chat/bug/feature), resources, community links

### Sub-Screens (Stack Navigation from Circles)
- **CircleHome**: Individual circle view with feed, challenges tab, members list, share progress

### Modal Screens
- **Listening**: Voice/text input modes, conversation transcripts, settings modal (language, speed, voice)

## Running the App
- **Web**: `npm run web` (runs on port 5000)
- **iOS**: `npm run ios`
- **Android**: `npm run android`

## File Structure
```
/
├── App.tsx                      # Main app component with navigation
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── babel.config.js              # Babel configuration
├── tsconfig.json                # TypeScript configuration
├── assets/                      # App icons, splash screens, mypa-orb.png
└── src/
    ├── styles/
    │   ├── colors.ts           # MYPA brand color palette (light/dark)
    │   ├── theme.ts            # Typography, spacing, shadows, card styles
    │   ├── animations.ts       # Reusable animation utilities
    │   └── index.ts            # Style exports
    ├── screens/                 # Screen components (16 screens total)
    │   ├── HubScreen.tsx        # Home dashboard
    │   ├── PlanScreen.tsx       # Daily schedule
    │   ├── InboxScreen.tsx      # Messages & notifications
    │   ├── ProfileScreen.tsx    # User profile
    │   ├── WalletScreen.tsx     # Wallet & transactions
    │   ├── ChallengesScreen.tsx # Challenges
    │   ├── CirclesScreen.tsx    # Social circles list
    │   ├── SettingsScreen.tsx   # App settings
    │   ├── TasksScreen.tsx      # Task management
    │   ├── ListeningScreen.tsx  # Voice/text input modal
    │   ├── StreakScreen.tsx     # Streak tracking & milestones
    │   ├── LevelScreen.tsx      # XP & level progression
    │   ├── ResetScreen.tsx      # Mindfulness/breathing exercises
    │   ├── EditProfileScreen.tsx    # Edit profile form
    │   ├── NotificationsScreen.tsx  # Notification preferences
    │   ├── PrivacyControlsScreen.tsx # Privacy settings
    │   ├── HelpSupportScreen.tsx    # Help & support
    │   └── CircleHomeScreen.tsx     # Individual circle view
    ├── components/              # Reusable UI components
    │   ├── ui/                  # UI component library
    │   │   ├── Accordion.tsx    # Expandable accordion
    │   │   ├── Alert.tsx        # Alert messages
    │   │   ├── Avatar.tsx       # User avatars
    │   │   ├── Badge.tsx        # Status badges
    │   │   ├── Button.tsx       # Button variants
    │   │   ├── Card.tsx         # Card containers
    │   │   ├── Checkbox.tsx     # Checkbox input
    │   │   ├── Dialog.tsx       # Modal dialogs
    │   │   ├── Input.tsx        # Text input
    │   │   ├── Progress.tsx     # Progress bar
    │   │   ├── Separator.tsx    # Visual separator
    │   │   ├── Switch.tsx       # Toggle switch
    │   │   ├── Label.tsx        # Form label
    │   │   ├── RadioGroup.tsx   # Radio button group
    │   │   ├── Select.tsx       # Dropdown select
    │   │   ├── Slider.tsx       # Value slider
    │   │   ├── Skeleton.tsx     # Loading skeleton
    │   │   ├── Toast.tsx        # Toast notifications
    │   │   ├── Sheet.tsx        # Bottom sheet modal
    │   │   ├── InputOTP.tsx     # OTP code input
    │   │   ├── Table.tsx        # Data table
    │   │   ├── Tabs.tsx         # Tab navigation
    │   │   ├── Textarea.tsx     # Multi-line input
    │   │   ├── Toggle.tsx       # Toggle button
    │   │   ├── ToggleGroup.tsx  # Toggle button group
    │   │   ├── Tooltip.tsx      # Tooltip on long press
    │   │   └── index.ts         # Component exports
    │   ├── MYPAOrb.tsx          # Animated MYPA AI orb
    │   ├── FloatingMYPAButton.tsx # Floating voice access button
    │   ├── IOSStatusBar.tsx     # iOS-style status bar
    │   ├── MissionCard.tsx      # Mission/task status card
    │   ├── ToggleSwitch.tsx     # Toggle switch component
    │   ├── VoicePill.tsx        # Voice input pill
    │   ├── TabBar.tsx           # Custom tab bar with center orb
    │   └── index.ts             # Component exports
    └── styles/
        └── colors.ts            # App color palette
```

## Navigation Structure
```
Tab Navigator
├── Home (HomeStack)
│   ├── Hub
│   ├── Wallet
│   ├── Challenges
│   ├── Settings
│   ├── Tasks
│   ├── Streak
│   ├── Level
│   └── Reset
├── Plan
├── Voice (triggers ListeningScreen modal)
├── Circles (CirclesStack)
│   ├── CirclesList
│   └── CircleHome
└── Profile (ProfileStack)
    ├── ProfileMain
    ├── EditProfile
    ├── Notifications
    ├── PrivacyControls
    ├── HelpSupport
    └── SettingsFromProfile
```

## Reusable Components
- **MYPAOrb**: Animated AI assistant orb with sparkle icon and glow effect
- **FloatingMYPAButton**: Floating action button for voice access from any screen
- **IOSStatusBar**: iOS-style status bar with time and system icons
- **MissionCard**: Card component for displaying mission/task status
- **ToggleSwitch**: Custom iOS-style toggle switch
- **VoicePill**: Voice input pill that transforms to orb when recording
- **TabBar**: Custom tab navigation bar with center voice button

## Color Palette
- Primary: #8B5CF6 (Purple)
- Work: #3B82F6 (Blue)
- Health: #10B981 (Green)
- Fitness: #F43F5E (Red)
- Wellness: #8B5CF6 (Purple)
- Creative: #F59E0B (Orange)
- Personal: #EC4899 (Pink)

## Recent Changes
- January 25, 2026: Added 7 new screens (StreakScreen, LevelScreen, EditProfileScreen, NotificationsScreen, PrivacyControlsScreen, HelpSupportScreen, CircleHomeScreen)
- January 25, 2026: Updated navigation with ProfileStack and CirclesStack for sub-screen navigation
- January 25, 2026: Connected Hub streak/level cards to new dedicated screens
- January 25, 2026: Connected Profile menu items to EditProfile, Notifications, PrivacyControls, HelpSupport screens
- January 25, 2026: Connected Circles list items to CircleHome screen
- January 25, 2026: Added reusable UI components (MYPAOrb, FloatingMYPAButton, VoicePill, TabBar, etc.)
- January 25, 2026: Replaced all emoji icons with vector icons from @expo/vector-icons
- January 25, 2026: Added ListeningScreen with voice/text modes and settings modal
- January 25, 2026: Added ResetScreen for mindfulness/breathing exercises with chat interface
