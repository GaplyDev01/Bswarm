# Project Structure

## Overview

The BlockSwarms project is organized into a standard React application structure with TypeScript. The main directories include:

- `src/`: Main source code
  - `components/`: React components
  - `contexts/`: React context providers
  - `hooks/`: Custom React hooks
  - `services/`: Service modules for API calls and business logic
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `pages/`: Page components
  - `context/`: Legacy context providers (being migrated to `contexts/`)
  - `assets/`: Static assets

## Key Files and Components

### Core Application Files

- `src/App.tsx`: Main application component
- `src/main.tsx`: Application entry point
- `src/index.css`: Global styles

### Context Providers

- `src/contexts/CardDataContext.tsx`: Context provider for managing card data
  - Provides methods for registering, unregistering, and accessing card data
  - Tracks focused card state

### Custom Hooks

- `src/hooks/useCardData.ts`: Hook for accessing the CardDataContext
  - Recently separated from CardDataContext.tsx to fix Fast Refresh warnings
  - Provides type-safe access to card data methods
- `src/hooks/useDebounce.ts`: Utility hook for debouncing values

### Components

- `src/components/AIFloatingButton.tsx`: Floating button for AI interactions
  - Uses the CardDataContext to access card data
  - Allows importing data from cards into AI requests
- `src/components/AITaskNotifications.tsx`: Notifications for AI task status
- `src/components/portal/TokenDetailsCard.tsx`: Card displaying token details
  - Uses the CardDataContext to register token data

### Services

- `src/services/aiService.ts`: Service for AI-related functionality
  - Handles sending requests to AI
  - Manages background tasks

## Recent Changes (2023-11-13)

### Hook Separation

We recently separated the `useCardData` hook from the `CardDataContext.tsx` file to fix Fast Refresh warnings:

```
Before:
src/contexts/CardDataContext.tsx (contained both context and hook)

After:
src/contexts/CardDataContext.tsx (context provider only)
src/hooks/useCardData.ts (hook only)
```

This change follows React best practices for custom hooks and improves development experience with Fast Refresh.

### Type Safety Improvements

We've improved type safety across the application:

1. Replaced `any` types with more specific types
2. Added proper null handling with optional chaining
3. Created specific interfaces for event handlers
4. Updated components to use the correct types

## Dependencies and Relationships

### Component Dependencies

```
Dashboard
├── CardDataProvider
│   ├── TokenDetailsCard (uses useCardData)
│   ├── AIFloatingButton (uses useCardData)
│   └── Other cards...
└── AITaskNotifications
```

### Context Usage

```
CardDataContext
├── useCardData hook
│   ├── TokenDetailsCard
│   ├── AIFloatingButton
│   └── Other components using card data...
```

## File Sizes and Metrics

- Total TypeScript files: ~50
- Average component size: ~150-200 lines
- Largest components:
  - Dashboard.tsx: ~500 lines
  - TokenDetailsCard.tsx: ~300 lines

## Feature Mapping

- Dashboard Layout Management: `src/components/portal/Dashboard.tsx`
- AI Integration: 
  - `src/services/aiService.ts`
  - `src/components/AIFloatingButton.tsx`
  - `src/components/AITaskNotifications.tsx`
- Token Data Display: `src/components/portal/TokenDetailsCard.tsx`

## Dashboard System Files

```
src/
├── components/
│   ├── portal/
│   │   ├── Dashboard.tsx               # Main dashboard container component
│   │   ├── DashboardPreferences.tsx    # Dashboard preferences/settings modal
│   │   ├── ProfileCard.tsx             # Dashboard card: User profile
│   │   ├── SignalsCard.tsx             # Dashboard card: Trading signals
│   │   ├── TokenDetailsCard.tsx        # Dashboard card: Token details
│   │   ├── TokenSearch.tsx             # Dashboard card: Token search
│   │   ├── SocialCard.tsx              # Dashboard card: Social activity
│   │   ├── NavBar.tsx                  # Navigation component
│   │   ├── UserMenu.tsx                # User menu component
│   │   ├── tabs/
│   │   │   ├── ChartsView.tsx          # Charts tab view
│   │   │   ├── ProfileView.tsx         # Profile tab view
│   │   │   ├── SignalsView.tsx         # Signals tab view
│   │   │   └── ChatView.tsx            # Chat tab view
│   │   └── tools/
│   │       ├── ChartTool.tsx           # Chart tool component
│   │       ├── TradingViewTool.tsx     # TradingView integration
│   │       ├── TechnicalIndicatorsTool.tsx # Technical indicators
│   │       ├── VolumeProfileTool.tsx   # Volume profile tool
│   │       ├── MomentumTool.tsx        # Momentum scanner
│   │       ├── MarketDepthTool.tsx     # Market depth visualization
│   │       ├── OrderFlowTool.tsx       # Order flow analysis
│   │       ├── LiquidityTool.tsx       # Liquidity analysis
│   │       ├── NewsFeedTool.tsx        # News feed tool
│   │       ├── SocialFeedTool.tsx      # Social feed analysis
│   │       ├── PatternAlertsTool.tsx   # Pattern recognition alerts
│   │       └── ChatHistoryTool.tsx     # Chat history tool
│   ├── AIFloatingButton.tsx            # AI assistant floating button
│   ├── AITaskNotifications.tsx         # AI task notifications
│   ├── BackgroundTasksBreadcrumb.tsx   # Collapsible breadcrumb menu for background tasks
│   ├── ThemeToggle.tsx                 # Theme toggle component
│   └── ui/                             # UI component library
│
├── types/
│   ├── index.ts                        # Common type definitions
│   └── dashboard.ts                    # Dashboard-specific types
│
├── contexts/
│   └── CardDataContext.tsx             # Context for sharing card data
│
├── services/
│   ├── aiService.ts                    # AI service integration
│   └── api.ts                          # API service for data fetching
│
├── hooks/
│   └── useCardData.ts                  # Hook for using card data
│
├── App.tsx                             # Main application component
├── index.css                           # Global styles
└── main.tsx                            # Application entry point
```

## Core Documentation Files

```
/
├── task-log.md                         # Task tracking and progress
├── dev-notes.md                        # Developer notes and technical documentation
└── file-tree.md                        # Project structure documentation
```

## Dashboard Component Structure

The dashboard system is built around a parent container component that manages multiple content cards in a responsive grid layout:

```
Dashboard
├── ProfileSelector                     # Trader profile selector
├── NavBar                              # Navigation tabs
├── ContentArea                         # Main content area
│   └── GridLayout                      # Responsive grid layout
│       ├── Card (ProfileCard)          # Profile card instance
│       ├── Card (SignalsCard)          # Signals card instance
│       ├── Card (TokenSearch)          # Token search card instance
│       └── ...                         # Other cards based on profile
└── DashboardPreferences                # Preferences modal
    ├── ProfileSelector                 # Trader profile selection
    ├── ColumnSelector                  # Layout column count selector
    └── CardSelector                    # Card visibility toggles
```

## Dashboard Views for Different Trader Types

The dashboard supports different predefined layouts for various trader profiles:

1. **Beginner Trader**
   - Profile, Signals, TokenSearch, TokenDetails, Social
   - 2-column layout for simplified experience

2. **Intermediate Trader**
   - Basic cards + PriceChart, NewsFeed
   - 3-column layout for more information density

3. **Advanced Trader**
   - Intermediate cards + TradingView, TechnicalIndicators, VolumeProfile, Momentum
   - 3-column layout with advanced technical tools

4. **Professional Trader**
   - All available cards and tools
   - 3-column layout with complete trading environment

5. **Custom**
   - User-defined selection of cards and tools
   - User-selected column count (1-3)
   - Custom card arrangement

Each profile is represented by a TraderProfile object that defines the visible cards, column count, and optional layout specification.

## CSS Architecture

Dashboard components use a combination of:
- Tailwind CSS utility classes
- Custom .dashboard-card class for consistent card styling
- Custom .dashboard-card-content class for internal content areas
- Custom .dashboard-container class for the main dashboard container 

## Background Tasks and Chat History Integration

The background tasks system is integrated with the chat history to provide a seamless experience for users. This integration allows users to see background task results directly in the chat and navigate between them.

```
src/
├── components/
│   ├── portal/
│   │   ├── ChatWithAgent.tsx           # Chat component (now with ref forwarding)
│   │   └── tabs/
│   │       └── ChatView.tsx            # Chat view with background tasks integration
│   │
│   ├── BackgroundTasksBreadcrumb.tsx   # Enhanced breadcrumb with chat integration
│   └── AIContext.tsx                   # AI context with background task message handling
│
├── contexts/
│   └── CardDataContext.tsx             # Context for sharing card data
│
├── services/
│   └── aiService.ts                    # AI service with background task tracking
│
└── index.css                           # Global styles with message highlighting
```

### Component Relationships

```
ChatView
├── ChatWithAgent (forwardRef)          # Forwards ref to messages container
├── BackgroundTasksBreadcrumb           # Shows background tasks
│   └── Task Items                      # Individual task items with actions
│       ├── Add to Chat                 # Adds task result to chat
│       └── View in Chat                # Navigates to task in chat
└── AIContext (Provider)                # Manages chat history and background tasks
    └── aiService                       # Tracks background tasks
```

### Data Flow

1. Background task is created via `aiService.addBackgroundTask()`
2. Task is processed asynchronously
3. When completed, task result is available in `BackgroundTasksBreadcrumb`
4. User can add task to chat via "Add to Chat" button
5. Task is added to chat history with special metadata
6. Message is highlighted in chat with animation
7. User can navigate between tasks and their chat messages

### Message Highlighting

The system uses CSS animations to highlight messages from background tasks:

```css
.highlighted-message {
  animation: highlight-pulse 2s ease-in-out 3;
  border-left: 3px solid #3b82f6;
  padding-left: 1rem;
  position: relative;
}
```

This provides visual feedback to users when navigating to messages from background tasks. 