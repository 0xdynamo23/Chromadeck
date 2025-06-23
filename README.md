# Presentation App

A modern, feature-rich presentation editor built with Next.js, Fabric.js, and Redux Toolkit. Create, edit, and manage presentation slides with a powerful canvas-based editor that supports text, images, and shapes.

![Presentation App](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## Features

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
- **Center Canvas**: Main editing area
- **Top Toolbar**: Tools and file operations
- **Modern Styling**: Clean, professional interface

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

## Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── Providers.tsx    # Redux provider wrapper
│   │   ├── slideCanvas.tsx  # Main canvas component
│   │   ├── slideList.tsx    # Sidebar slide management
│   │   └── Toolbar.tsx      # Top toolbar with tools
│   ├── redux/               # Redux store and slices
│   │   ├── store.ts         # Store configuration
│   │   └── presentationSlice.ts # Main state slice
│   ├── utils/               # Utility functions
│   │   └── fileHandlers.ts  # File operations
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

## API Reference

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

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure build settings** (uses default Next.js settings)
3. **Deploy** - automatic deployments on push

### Netlify

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `out` folder** to Netlify

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## Roadmap

- [ ] Undo/Redo functionality
- [ ] Template library
- [ ] Advanced text formatting
- [ ] Animation support
- [ ] Collaborative editing
- [ ] Presentation mode
- [ ] Export to PDF/PowerPoint

---

**Built with ❤️ using Next.js, Fabric.js, and modern web technologies.**
