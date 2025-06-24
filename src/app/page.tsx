'use client';

import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { addSlide } from './redux/presentationSlice';
import { SlideCanvas, SlideCanvasRef } from './components/slideCanvas';
import { SlideList } from './components/slideList';
import { Toolbar } from './components/Toolbar';

export default function Home() {
  const dispatch = useDispatch();
  const canvasRef = useRef<SlideCanvasRef>(null);
  
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const error = useSelector((state: RootState) => state.presentation.error);

  // Create initial slide if none exist
  useEffect(() => {
    if (slides.length === 0) {
      dispatch(addSlide({ name: 'Slide 1' }));
    }
  }, [slides.length, dispatch]);

  const handleAddImageFromUrl = (url: string) => {
    if (canvasRef.current?.addImageFromUrl) {
      canvasRef.current.addImageFromUrl(url);
    }
  };

  const handleAddImageFromFile = () => {
    if (canvasRef.current?.addImageFromFile) {
      canvasRef.current.addImageFromFile();
    }
  };

  const handleTextFormatChange = (format: { fontSize?: number; fontWeight?: string; fontStyle?: string; textAlign?: string; fill?: string }) => {
    if (canvasRef.current?.updateSelectedTextFormat) {
      canvasRef.current.updateSelectedTextFormat(format);
    }
  };

  const handleShapeFormatChange = (format: { fill?: string; stroke?: string; strokeWidth?: number }) => {
    if (canvasRef.current?.updateSelectedShapeFormat) {
      canvasRef.current.updateSelectedShapeFormat(format);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0">
        <Toolbar
          onAddImageFromUrl={handleAddImageFromUrl}
          onAddImageFromFile={handleAddImageFromFile}
          onTextFormatChange={handleTextFormatChange}
          onShapeFormatChange={handleShapeFormatChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - Slide List */}
        <SlideList className="w-64 flex-shrink-0 overflow-hidden" />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <SlideCanvas 
            ref={canvasRef}
            className="flex-1 min-h-0"
          />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
