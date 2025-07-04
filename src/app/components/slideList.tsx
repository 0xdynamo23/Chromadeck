'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import {
  addSlide,
  deleteSlide,
  setCurrentSlide,
  duplicateSlide,
  updateSlide,
} from '../redux/presentationSlice';

interface SlideListProps {
  className?: string;
}

export const SlideList: React.FC<SlideListProps> = ({ className }) => {
  const dispatch = useDispatch();
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const slides = useSelector((state: RootState) => state.presentation.slides);
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);

  const handleAddSlide = () => {
    dispatch(addSlide({}));
  };

  const handleSelectSlide = (slideId: string) => {
    if (editingSlideId !== slideId) {
      dispatch(setCurrentSlide(slideId));
    }
  };

  const handleDeleteSlide = (slideId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (slides.length > 1) {
      dispatch(deleteSlide(slideId));
    }
  };

  const handleDuplicateSlide = (slideId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(duplicateSlide(slideId));
  };

  const handleStartEditing = (slideId: string, currentName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSlideId(slideId);
    setEditingName(currentName);
  };

  const handleSaveEdit = (slideId: string) => {
    if (editingName.trim()) {
      dispatch(updateSlide({ id: slideId, name: editingName.trim() }));
    }
    setEditingSlideId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setEditingName('');
  };

  const handleKeyDown = (event: React.KeyboardEvent, slideId: string) => {
    if (event.key === 'Enter') {
      handleSaveEdit(slideId);
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className={`${className} bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col shadow-lg`}>
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base lg:text-lg font-bold text-gray-800 tracking-tight">Slides</h2>
          <span className="text-xs lg:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{slides.length}</span>
        </div>
        <button
          onClick={handleAddSlide}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-2 lg:px-3 py-2 lg:py-3 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 lg:gap-2 shadow-sm hover:shadow-md"
        >
          <svg className="w-3 lg:w-4 h-3 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Slide
        </button>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-1 lg:p-2">
        {slides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No slides yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "Add Slide" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => handleSelectSlide(slide.id)}
                className={`group relative bg-white border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-102 ${
                  currentSlideId === slide.id
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Slide Number */}
                <div className="absolute -top-1 lg:-top-2 -left-1 lg:-left-2 bg-white border border-gray-300 text-gray-800 text-xs rounded-full w-5 lg:w-6 h-5 lg:h-6 flex items-center justify-center font-medium z-10 shadow-sm">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {slide.thumbnail ? (
                    <img
                      src={slide.thumbnail}
                      alt={slide.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Slide Name */}
                <div className="p-2 lg:p-3">
                  {editingSlideId === slide.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveEdit(slide.id)}
                      onKeyDown={(e) => handleKeyDown(e, slide.id)}
                      className="w-full text-xs lg:text-sm font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-xs lg:text-sm font-medium text-gray-800 truncate">{slide.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 hidden lg:block">
                    Updated {new Date(slide.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <button
                    onClick={(e) => handleStartEditing(slide.id, slide.name, e)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-gray-800 p-1 rounded shadow-sm transition-colors duration-200"
                    title="Rename slide"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDuplicateSlide(slide.id, e)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-gray-800 p-1 rounded shadow-sm transition-colors duration-200"
                    title="Duplicate slide"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteSlide(slide.id, e)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 text-red-600 hover:text-red-800 p-1 rounded shadow-sm transition-colors duration-200"
                      title="Delete slide"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Current Slide Indicator */}
                {currentSlideId === slide.id && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
