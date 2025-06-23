'use client';

import React, { useState, useRef } from 'react';
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
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  className, 
  onAddImageFromUrl, 
  onAddImageFromFile 
}) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<any>(null);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const selectedTool = useSelector((state: RootState) => state.presentation.selectedTool);
  const presentationName = useSelector((state: RootState) => state.presentation.presentationName);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const lastSaved = useSelector((state: RootState) => state.presentation.lastSaved);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const isDirty = useSelector((state: RootState) => state.presentation.isDirty);

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

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
      return;
    }
    console.log('🔧 Tool selected:', toolId);
    dispatch(setSelectedTool(toolId));
  };

  const handleSavePresentation = async () => {
    try {
      await FileHandlers.savePresentation(presentationName, slides);
      dispatch(markAsSaved());
    } catch (error) {
      dispatch(setError('Failed to save presentation'));
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
      setShowImageUrlModal(false);
    }
  };

  const handleAddImageFromFile = () => {
    if (onAddImageFromFile) {
      onAddImageFromFile();
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
      <div className={`${className} bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 flex items-center justify-between px-6 py-4 shadow-sm`}>
        {/* Left Section - Presentation Name */}
        <div className="flex items-center gap-4">
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
            <span className="text-xs text-gray-500">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Center Section - Tools */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
          {tools.map((tool) => (
            tool.id === 'image' ? (
              <div key={tool.id} className="relative">
                <button
                  className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105 ${
                    selectedTool === tool.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md ring-2 ring-blue-200'
                      : 'hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 hover:ring-1 hover:ring-gray-200'
                  }`}
                  title={tool.name}
                  onClick={() => setShowImageUrlModal(true)}
                >
                  {getToolIcon(tool.icon)}
                </button>
              </div>
            ) : (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105 ${
                  selectedTool === tool.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md ring-2 ring-blue-200'
                    : 'hover:bg-white hover:shadow-md text-gray-600 hover:text-gray-800 hover:ring-1 hover:ring-gray-200'
                }`}
                title={tool.name}
              >
                {getToolIcon(tool.icon)}
              </button>
            )
          ))}
        </div>

        {/* Right Section - File Operations */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewPresentation}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            title="New Presentation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>


          
          <button
            onClick={handleLoadPresentation}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Load
          </button>
          
          <button
            onClick={handleSavePresentation}
            disabled={slides.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
              isDirty 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isDirty ? 'Save*' : 'Save'}
          </button>
        </div>
      </div>

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            
            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImageFromUrl()}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Add from URL
                </button>
                
                <button
                  onClick={handleAddImageFromFile}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Upload File
                </button>
              </div>

              <button
                onClick={() => {
                  setShowImageUrlModal(false);
                  setImageUrl('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
