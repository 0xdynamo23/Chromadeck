'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import {
  setSelectedTool,
  setPresentationName,
  loadPresentation,
  markAsSaved,
  setError,
  addSlide,
  clearPresentation,
} from '../redux/presentationSlice';
import { FileHandlers } from '../utils/fileHandlers';

interface ToolbarProps {
  className?: string;
  onAddImageFromUrl?: (url: string) => void;
  onAddImageFromFile?: () => void;
  onTextFormatChange?: (format: { fontSize?: number; fontWeight?: string; fontStyle?: string; textAlign?: string; fill?: string }) => void;
  onShapeFormatChange?: (format: { fill?: string; stroke?: string; strokeWidth?: number }) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  className, 
  onAddImageFromUrl, 
  onAddImageFromFile,
  onTextFormatChange,
  onShapeFormatChange,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<any>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showTextFormatDropdown, setShowTextFormatDropdown] = useState(false);
  const [showShapeFormatDropdown, setShowShapeFormatDropdown] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentFillColor, setCurrentFillColor] = useState('#000000');
  const [currentBorderColor, setCurrentBorderColor] = useState('#2563eb');
  const [currentBorderWidth, setCurrentBorderWidth] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textFormatRef = useRef<HTMLDivElement>(null);
  const shapeFormatRef = useRef<HTMLDivElement>(null);
  const imageOptionsRef = useRef<HTMLDivElement>(null);
  
  const selectedTool = useSelector((state: RootState) => state.presentation.selectedTool);
  const presentationName = useSelector((state: RootState) => state.presentation.presentationName);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const lastSaved = useSelector((state: RootState) => state.presentation.lastSaved);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const isDirty = useSelector((state: RootState) => state.presentation.isDirty);

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSaveDropdown(false);
      }
      if (textFormatRef.current && !textFormatRef.current.contains(event.target as Node)) {
        setShowTextFormatDropdown(false);
      }
      if (shapeFormatRef.current && !shapeFormatRef.current.contains(event.target as Node)) {
        setShowShapeFormatDropdown(false);
      }
      if (imageOptionsRef.current && !imageOptionsRef.current.contains(event.target as Node)) {
        setShowImageOptions(false);
      }
    };

    if (showSaveDropdown || showTextFormatDropdown || showShapeFormatDropdown || showImageOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSaveDropdown, showTextFormatDropdown, showShapeFormatDropdown, showImageOptions]);

  const tools = [
    { id: 'select', name: 'Select', icon: 'cursor' },
    { id: 'text', name: 'Text', icon: 'text' },
    { id: 'rectangle', name: 'Rectangle', icon: 'rectangle' },
    { id: 'circle', name: 'Circle', icon: 'circle' },
    { id: 'line', name: 'Line', icon: 'line' },
    { id: 'image', name: 'Image', icon: 'image' },
  ] as const;

  const handleToolSelect = (toolId: typeof selectedTool) => {
    if (toolId === 'image') {
      // Show image options instead of selecting the tool
      setShowImageOptions(!showImageOptions);
      return;
    }
    console.log('🔧 Tool selected:', toolId);
    dispatch(setSelectedTool(toolId));
  };

  const handleSavePresentation = async (format: 'json' | 'pptx' = 'json') => {
    try {
      await FileHandlers.savePresentation(presentationName, slides, format);
      dispatch(markAsSaved());
      setShowSaveDropdown(false);
    } catch (error) {
      dispatch(setError(`Failed to save presentation as ${format.toUpperCase()}`));
    }
  };

  const handleLoadPresentation = async () => {
    try {
      const data = await FileHandlers.loadPresentation();
      dispatch(loadPresentation({ slides: data.slides, name: data.name }));
    } catch (error) {
      dispatch(setError('Failed to load presentation'));
    }
  };

  const handleAddImageFromUrl = () => {
    if (imageUrl.trim() && onAddImageFromUrl) {
      onAddImageFromUrl(imageUrl.trim());
      setImageUrl('');
      setShowImageOptions(false);
    }
  };

  const handleAddImageFromFile = () => {
    if (onAddImageFromFile) {
      onAddImageFromFile();
      setShowImageOptions(false);
    }
  };

  const handleNewPresentation = () => {
    if (isDirty) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to create a new presentation?');
      if (!confirm) return;
    }
    dispatch(clearPresentation());
    dispatch(addSlide({ name: 'Slide 1' }));
  };

  const handleAddSlide = () => {
    dispatch(addSlide({}));
  };

  const handleSaveName = () => {
    setIsEditingName(false);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSaveName();
    } else if (event.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const handleTextFormatChange = (format: { fontSize?: number; fontWeight?: string; fontStyle?: string; textAlign?: string; fill?: string }) => {
    if (onTextFormatChange) {
      onTextFormatChange(format);
    }
    
    // Update local state for UI
    if (format.fontSize) setCurrentFontSize(format.fontSize);
    if (format.fill) setCurrentTextColor(format.fill);
  };

  const handleShapeFormatChange = (format: { fill?: string; stroke?: string; strokeWidth?: number }) => {
    if (onShapeFormatChange) {
      onShapeFormatChange(format);
    }
    
    // Update local state for UI
    if (format.fill) setCurrentFillColor(format.fill);
    if (format.stroke) setCurrentBorderColor(format.stroke);
    if (format.strokeWidth) setCurrentBorderWidth(format.strokeWidth);
  };

  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];
  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB'];
  const borderWidths = [1, 2, 3, 4, 5, 6, 8, 10];

  const getToolIcon = (iconType: string) => {
    switch (iconType) {
      case 'cursor':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        );
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'rectangle':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
        );
      case 'circle':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
      case 'line':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`${className} bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 shadow-sm`}>
        {/* Mobile Sidebar Toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}

        {/* Left Section - Presentation Name */}
        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1 lg:flex-initial">
          {isEditingName ? (
            <input
              type="text"
              value={presentationName}
              onChange={(e) => dispatch(setPresentationName(e.target.value))}
              onBlur={handleSaveName}
              onKeyDown={handleNameKeyDown}
              className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 outline-none min-w-0 max-w-xs"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingName(true)}
              className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              title="Click to edit presentation name"
            >
              {presentationName}
            </h1>
          )}
          
          {lastSaved && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Center Section - Tools and Formatting */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 lg:gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
            {tools.map((tool) => (
              tool.id === 'image' ? (
                <div key={tool.id} className="relative" ref={imageOptionsRef}>
                  <button
                    className={`p-2 lg:p-3 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105 ${
                      showImageOptions
                        ? 'bg-gray-200 border border-gray-300 text-gray-800 shadow-sm'
                        : 'hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 hover:ring-1 hover:ring-gray-200'
                    }`}
                    title={tool.name}
                    onClick={() => handleToolSelect(tool.id)}
                  >
                    {getToolIcon(tool.icon)}
                  </button>

                  {/* Image Options Dropdown */}
                  {showImageOptions && (
                    <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Add Image</h4>
                        
                        {/* Drag & Drop Info */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-blue-800 font-medium">Drag & drop images directly onto the canvas!</span>
                          </div>
                        </div>

                        {/* URL Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or add from URL
                          </label>
                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddImageFromUrl()}
                          />
                          <button
                            onClick={handleAddImageFromUrl}
                            disabled={!imageUrl.trim()}
                            className="mt-2 w-full bg-blue-100 border border-blue-300 hover:bg-blue-200 disabled:bg-gray-200 disabled:cursor-not-allowed text-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                          >
                            Add from URL
                          </button>
                        </div>

                        {/* File Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or browse files
                          </label>
                          <button
                            onClick={handleAddImageFromFile}
                            className="w-full bg-green-100 border border-green-300 hover:bg-green-200 text-green-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Choose File
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`p-2 lg:p-3 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105 ${
                    selectedTool === tool.id
                      ? 'bg-gray-200 border border-gray-300 text-gray-800 shadow-sm'
                      : 'hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 hover:ring-1 hover:ring-gray-200'
                  }`}
                  title={tool.name}
                >
                  {getToolIcon(tool.icon)}
                </button>
              )
            ))}
          </div>

          {/* Shape Formatting Controls */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={shapeFormatRef}>
              <button
                onClick={() => setShowShapeFormatDropdown(!showShapeFormatDropdown)}
                className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 text-sm font-medium transition-all duration-200 flex items-center gap-1"
                title="Shape Formatting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                Shape
                <svg className={`w-3 h-3 transition-transform duration-200 ${showShapeFormatDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Shape Format Dropdown */}
              {showShapeFormatDropdown && (
                <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Shape Formatting</h4>
                    
                    {/* Fill Color */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fill Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeFormatChange({ fill: color })}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              currentFillColor === color
                                ? 'border-blue-400 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Custom Fill Color */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={currentFillColor}
                          onChange={(e) => handleShapeFormatChange({ fill: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                          title="Custom Fill Color"
                        />
                        <span className="text-sm text-gray-600">Custom Fill</span>
                      </div>
                    </div>

                    {/* Border Color */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeFormatChange({ stroke: color })}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              currentBorderColor === color
                                ? 'border-blue-400 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Custom Border Color */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={currentBorderColor}
                          onChange={(e) => handleShapeFormatChange({ stroke: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                          title="Custom Border Color"
                        />
                        <span className="text-sm text-black">Custom Border</span>
                      </div>
                    </div>

                    {/* Border Width */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Border Width</label>
                      <div className="grid grid-cols-4 gap-2 text-black">
                        {borderWidths.map((width) => (
                          <button
                            key={width}
                            onClick={() => handleShapeFormatChange({ strokeWidth: width })}
                            className={`px-3 py-2 text-sm rounded border transition-colors ${
                              currentBorderWidth === width
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {width}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Shape Format Indicators */}
            <div className="flex items-center gap-1">
              <div
                className="w-6 h-6 border-2 border-gray-300 rounded cursor-pointer"
                style={{ backgroundColor: currentFillColor }}
                onClick={() => setShowShapeFormatDropdown(!showShapeFormatDropdown)}
                title="Fill Color"
              />
              <div
                className="w-6 h-6 border-2 rounded cursor-pointer"
                style={{ borderColor: currentBorderColor, backgroundColor: 'transparent' }}
                onClick={() => setShowShapeFormatDropdown(!showShapeFormatDropdown)}
                title="Border Color"
              />
            </div>
          </div>

          {/* Text Formatting Controls */}
          <div className="flex items-center gap-2 text-black">
            {/* Font Size */}
            <div className="relative" ref={textFormatRef}>
              <button
                onClick={() => setShowTextFormatDropdown(!showTextFormatDropdown)}
                className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 text-sm font-medium transition-all duration-200 flex items-center gap-1"
                title="Text Formatting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {currentFontSize}px
                <svg className={`w-3 h-3 transition-transform duration-200 ${showTextFormatDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Text Format Dropdown */}
              {showTextFormatDropdown && (
                <div className="absolute left-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Text Formatting</h4>
                    
                    {/* Font Size */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                      <div className="grid grid-cols-6 gap-1">
                        {fontSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => handleTextFormatChange({ fontSize: size })}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              currentFontSize === size
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {size}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Style Buttons */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTextFormatChange({ fontWeight: 'bold' })}
                          className="px-3 py-2 text-sm font-bold border rounded hover:bg-gray-50 transition-colors"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          onClick={() => handleTextFormatChange({ fontStyle: 'italic' })}
                          className="px-3 py-2 text-sm italic border rounded hover:bg-gray-50 transition-colors"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          onClick={() => handleTextFormatChange({ fontWeight: 'normal', fontStyle: 'normal' })}
                          className="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                          title="Normal"
                        >
                          Normal
                        </button>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTextFormatChange({ textAlign: 'left' })}
                          className="p-2 border rounded hover:bg-gray-50 transition-colors"
                          title="Align Left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleTextFormatChange({ textAlign: 'center' })}
                          className="p-2 border rounded hover:bg-gray-50 transition-colors"
                          title="Align Center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8m-8 6h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleTextFormatChange({ textAlign: 'right' })}
                          className="p-2 border rounded hover:bg-gray-50 transition-colors"
                          title="Align Right"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M4 18h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleTextFormatChange({ fill: color })}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              currentTextColor === color
                                ? 'border-blue-400 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Custom Color Input */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={currentTextColor}
                          onChange={(e) => handleTextFormatChange({ fill: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                          title="Custom Color"
                        />
                        <span className="text-sm text-gray-600">Custom</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Format Buttons */}
            <button
              onClick={() => handleTextFormatChange({ fontWeight: 'bold' })}
              className="p-2 rounded-lg hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 font-bold transition-all duration-200"
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => handleTextFormatChange({ fontStyle: 'italic' })}
              className="p-2 rounded-lg hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 italic transition-all duration-200"
              title="Italic"
            >
              I
            </button>
            
            {/* Color Indicator */}
            <div
              className="w-6 h-6 border-2 border-gray-300 rounded cursor-pointer"
              style={{ backgroundColor: currentTextColor }}
              onClick={() => setShowTextFormatDropdown(!showTextFormatDropdown)}
              title="Text Color"
            />
          </div>
        </div>

        {/* Right Section - File Operations */}
        <div className="flex items-center gap-1 lg:gap-3">
          {/* Add Slide Button */}
          <button
            onClick={handleAddSlide}
            className="px-2 lg:px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-medium transition-all duration-200 flex items-center gap-1 lg:gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Slide</span>
          </button>

          {/* Load Button - Hidden on mobile */}
          <button
            onClick={handleLoadPresentation}
            className="hidden sm:flex px-2 lg:px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-medium transition-all duration-200 items-center gap-1 lg:gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
            </svg>
            Load
          </button>

          {/* New Button - Hidden on mobile */}
          <button
            onClick={handleNewPresentation}
            className="hidden sm:flex px-2 lg:px-3 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-medium transition-all duration-200 items-center gap-1 lg:gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New
          </button>

          {/* Save Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSaveDropdown(!showSaveDropdown)}
              disabled={slides.length === 0}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                isDirty 
                  ? 'bg-orange-100 border border-orange-300 hover:bg-orange-200 text-orange-800' 
                  : 'bg-blue-100 border border-blue-300 hover:bg-blue-200 disabled:bg-gray-200 disabled:cursor-not-allowed text-blue-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isDirty ? 'Save*' : 'Save'}
              <svg className={`w-3 h-3 transition-transform duration-200 ${showSaveDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Save Dropdown */}
            {showSaveDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleSavePresentation('json')}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Save as JSON</div>
                      <div className="text-xs text-blue-600">Native format with full editing support</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleSavePresentation('pptx')}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-orange-50 transition-colors duration-200 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Save as PowerPoint (.pptx)</div>
                      <div className="text-xs text-orange-600">🚧 Coming soon - saves as JSON for now</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tools Bar - Hidden on desktop */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Essential Tools */}
          <div className="flex items-center gap-1">
            {tools.slice(0, 4).map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  selectedTool === tool.id
                    ? 'bg-blue-100 border border-blue-300 text-blue-800'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                }`}
                title={tool.name}
              >
                {getToolIcon(tool.icon)}
              </button>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            {/* Text Format Toggle */}
            <button
              onClick={() => setShowTextFormatDropdown(!showTextFormatDropdown)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="Text Format"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* File Operations */}
            <button
              onClick={handleLoadPresentation}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="Load"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
              </svg>
            </button>

            <button
              onClick={handleNewPresentation}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
              title="New"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
