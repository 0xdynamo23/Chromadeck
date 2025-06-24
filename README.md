# Presentation App

A modern, feature-rich presentation editor built with Next.js, Fabric.js, and Redux Toolkit. Create, edit, and manage presentation slides with a powerful canvas-based editor that supports text, images, and shapes.


### 🎨 Slide Management
- **Create & Delete Slides**: Add new slides or remove existing ones with ease
- **Switch Between Slides**: Navigate through your presentation seamlessly
- **Duplicate Slides**: Copy existing slides to save time
- **Rename Slides**: Custom names for better organization
- **Slide Thumbnails**: Visual previews in the sidebar

### ✏️ Canvas Editing (Fabric.js)
- **Text Boxes**: Add and edit text with various formatting options
- **Images**: Support for both URL and local file uploads (up to 5MB)
- **Basic Shapes**: Rectangle, circle, and line tools
- **Interactive Elements**: Move, resize, and rotate objects
- **Selection Tool**: Multi-select and group operations

### 🔄 State Management (Redux Toolkit)
- **Centralized State**: All presentation data managed through Redux
- **Slide Array Storage**: Each slide stored as Fabric.js JSON
- **Active Slide Tracking**: Current slide state management
- **Tool Selection**: Current editing tool state
- **Undo/Redo Support**: Coming soon

### 💾 File Operations
- **Save Presentations**: Export as `.json` files using browser APIs
- **Load Presentations**: Import previously saved presentations
- **Auto-Save**: Automatic state persistence during editing
- **Export Slides**: Save individual slides as PNG images

### 🎯 Modern UI (Tailwind CSS)
- **Responsive Design**: Works on desktop and tablet devices
- **Left Sidebar**: Slide thumbnails and management
- **Center Canvas**: Main editing area with drag-and-drop support
- **Top Toolbar**: Tools and file operations
- **Clean Styling**: Professional, accessible interface with proper contrast

## Development Approach

### Architecture Overview

This presentation app was built with a **component-based architecture** using modern React patterns and TypeScript for type safety. The application follows a **unidirectional data flow** pattern with Redux Toolkit for state management.

#### **1. Frontend Architecture (React + TypeScript)**

**Component Structure:**
```
src/app/
├── components/           # Reusable UI components
│   ├── slideCanvas.tsx   # Main canvas component (Fabric.js)
│   ├── slideList.tsx     # Sidebar slide management
│   ├── Toolbar.tsx       # Top toolbar with tools
│   └── Providers.tsx     # Redux and other providers
├── redux/               # State management
│   ├── store.ts         # Redux store configuration
│   └── presentationSlice.ts # Main state slice
├── utils/               # Utility functions
│   └── fileHandlers.ts  # File operations
└── page.tsx            # Main app entry point
```

**Design Principles:**
- **Single Responsibility**: Each component has a clear, focused purpose
- **Composition over Inheritance**: Components are composed together
- **Type Safety**: Full TypeScript coverage for props, state, and APIs
- **Performance**: React.memo, useCallback, and useMemo for optimization
- **Accessibility**: Proper ARIA labels, keyboard navigation, semantic HTML

#### **2. Canvas Management (Fabric.js Integration)**

**Canvas Architecture:**
```typescript
// Canvas wrapper with imperative handle
const SlideCanvas = forwardRef<SlideCanvasRef, SlideCanvasProps>()

// Exposed methods to parent components
interface SlideCanvasRef {
  addImageFromUrl: (url: string) => Promise<void>
  addImageFromFile: () => Promise<void>
  updateSelectedTextFormat: (format) => void
  updateSelectedShapeFormat: (format) => void
  canvas: fabric.Canvas | null
}
```

**Key Design Decisions:**
- **Fabric.js Canvas**: Chosen for its robust 2D canvas manipulation capabilities
- **JSON Serialization**: Each slide stored as Fabric.js JSON for persistence
- **Debounced Saves**: Prevent excessive state updates during user interactions
- **Canvas Lifecycle**: Proper setup, cleanup, and memory management
- **Event Handling**: Mouse, keyboard, and drag-and-drop event management

#### **3. State Management (Redux Toolkit)**

**State Architecture:**
```typescript
interface PresentationState {
  slides: Slide[]                    // Array of slides
  currentSlideId: string | null      // Active slide
  presentationName: string           // Presentation title
  selectedTool: ToolType             // Current editing tool
  isDirty: boolean                   // Unsaved changes flag
  lastSaved: number | null           // Last save timestamp
  error: string | null               // Error messages
}
```

**Redux Design Patterns:**
- **Slice Pattern**: Single slice for presentation state
- **Immer Integration**: Immutable updates with Redux Toolkit
- **Normalized State**: Slides stored in array with unique IDs
- **Action Creators**: Type-safe action creators with payloads
- **Selectors**: Memoized selectors for derived state

#### **4. User Experience Design**

**Interaction Patterns:**
- **Tool Selection**: Click tool → Click canvas → Object created
- **Object Editing**: Select object → Edit properties → Auto-save
- **File Management**: Drag files → Drop on canvas → Auto-process
- **Keyboard Shortcuts**: Del key → Delete selected objects

**Visual Feedback Systems:**
- **Loading States**: Progress bars for image uploads
- **Hover Effects**: Visual feedback on interactive elements
- **Selection States**: Clear indication of selected tools/objects
- **Error Handling**: User-friendly error messages

**Accessibility Features:**
- **Keyboard Navigation**: Tab order, Enter/Escape keys
- **Screen Reader Support**: ARIA labels and semantic markup
- **Color Contrast**: High contrast for text visibility
- **Focus Management**: Clear focus indicators

#### **5. Technical Challenges Solved**

**Canvas State Synchronization:**
- Challenge: Keeping Fabric.js canvas state in sync with Redux store
- Solution: Debounced auto-save with JSON serialization and event listeners

**Memory Management:**
- Challenge: Preventing memory leaks with canvas objects
- Solution: Proper cleanup in useEffect cleanup functions

**Drag & Drop Integration:**
- Challenge: File drag-and-drop with visual feedback
- Solution: Native HTML5 drag-and-drop API with custom overlay components

**Type Safety with Fabric.js:**
- Challenge: TypeScript integration with Fabric.js library
- Solution: Custom type definitions and proper type assertions

## Tech Stack

- **Framework**: Next.js 15.3.4 with App Router
- **Frontend**: React 19.0.0 with TypeScript
- **Canvas**: Fabric.js 6.4.0 for interactive editing
- **State Management**: Redux Toolkit 2.2.7
- **Styling**: Tailwind CSS 4.0
- **Deployment**: Vercel/Netlify ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd presentation-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Creating Your First Presentation

1. **Start with a Slide**: The app automatically creates your first slide
2. **Add Content**: Use the toolbar to add text, shapes, or images
3. **Manage Slides**: Use the sidebar to add, delete, or switch between slides
4. **Save Your Work**: Use the "Save" button to download your presentation

### Keyboard Shortcuts

- **Enter**: Confirm text editing or slide renaming
- **Escape**: Cancel editing operations
- **Delete**: Remove selected objects from canvas

### File Management

- **Save**: Downloads a `.json` file with all presentation data
- **Load**: Upload a previously saved `.json` file
- **Export**: Save individual slides as PNG images

### Redux Actions

```typescript
// Slide Management
addSlide({ name?: string })
deleteSlide(slideId: string)
setCurrentSlide(slideId: string)
updateSlide({ id, canvasData?, name?, thumbnail? })
duplicateSlide(slideId: string)

// Presentation Management
setPresentationName(name: string)
loadPresentation({ slides, name })
clearPresentation()
setSelectedTool(tool: ToolType)
```

### File Handlers

```typescript
// Save/Load Operations
FileHandlers.savePresentation(name: string, slides: Slide[])
FileHandlers.loadPresentation(): Promise<PresentationData>
FileHandlers.loadImageFromFile(): Promise<string>
FileHandlers.loadImageFromUrl(url: string): Promise<string>
FileHandlers.generateThumbnail(canvas: HTMLCanvasElement): string
```

**Built with ❤️ by Yash.**
