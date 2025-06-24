import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Slide {
  id: string;
  name: string;
  canvasData: string; // JSON string of Fabric.js canvas
  thumbnail?: string; // Base64 thumbnail
  createdAt: number;
  updatedAt: number;
}

export interface PresentationState {
  slides: Slide[];
  currentSlideId: string | null;
  currentSlideIndex: number;
  selectedTool: 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'image';
  isLoading: boolean;
  error: string | null;
  presentationName: string;
  lastSaved: number | null;
  isDirty: boolean; // Track if presentation has unsaved changes
}

const initialState: PresentationState = {
  slides: [],
  currentSlideId: null,
  currentSlideIndex: -1,
  selectedTool: 'select',
  isLoading: false,
  error: null,
  presentationName: 'Untitled Presentation',
  lastSaved: null,
  isDirty: false,
};

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    addSlide: (state, action: PayloadAction<{ name?: string }>) => {
      const timestamp = Date.now();
      const newSlide: Slide = {
        id: `slide-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name || `Slide ${state.slides.length + 1}`,
        canvasData: JSON.stringify({ objects: [], background: '#ffffff' }),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.slides.push(newSlide);
      if (!state.currentSlideId) {
        state.currentSlideId = newSlide.id;
        state.currentSlideIndex = 0;
      }
      state.isDirty = true;
    },

    deleteSlide: (state, action: PayloadAction<string>) => {
      const slideIndex = state.slides.findIndex(slide => slide.id === action.payload);
      if (slideIndex !== -1) {
        state.slides.splice(slideIndex, 1);
        
        // If we deleted the current slide, select another one
        if (state.currentSlideId === action.payload) {
          if (state.slides.length > 0) {
            // Select the previous slide if possible, otherwise the next one
            const newIndex = slideIndex > 0 ? slideIndex - 1 : 0;
            state.currentSlideId = state.slides[newIndex]?.id || null;
          } else {
            state.currentSlideId = null;
          }
        }
      }
    },

    setCurrentSlide: (state, action: PayloadAction<string>) => {
      const slideIndex = state.slides.findIndex(slide => slide.id === action.payload);
      if (slideIndex !== -1) {
        state.currentSlideId = action.payload;
        state.currentSlideIndex = slideIndex;
      }
    },

    updateSlide: (state, action: PayloadAction<{ id: string; canvasData?: string; name?: string; thumbnail?: string }>) => {
      const slide = state.slides.find(slide => slide.id === action.payload.id);
      if (slide) {
        if (action.payload.canvasData !== undefined) {
          slide.canvasData = action.payload.canvasData;
          state.isDirty = true;
        }
        if (action.payload.name !== undefined) {
          slide.name = action.payload.name;
          state.isDirty = true;
        }
        if (action.payload.thumbnail !== undefined) {
          slide.thumbnail = action.payload.thumbnail;
        }
        slide.updatedAt = Date.now();
      }
    },

    duplicateSlide: (state, action: PayloadAction<string>) => {
      const originalSlide = state.slides.find(slide => slide.id === action.payload);
      if (originalSlide) {
        const timestamp = Date.now();
        const duplicatedSlide: Slide = {
          ...originalSlide,
          id: `slide-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${originalSlide.name} (Copy)`,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const originalIndex = state.slides.findIndex(slide => slide.id === action.payload);
        state.slides.splice(originalIndex + 1, 0, duplicatedSlide);
      }
    },

    reorderSlides: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      if (fromIndex >= 0 && fromIndex < state.slides.length && 
          toIndex >= 0 && toIndex < state.slides.length) {
        const [movedSlide] = state.slides.splice(fromIndex, 1);
        state.slides.splice(toIndex, 0, movedSlide);
      }
    },

    setSelectedTool: (state, action: PayloadAction<PresentationState['selectedTool']>) => {
      state.selectedTool = action.payload;
    },

    setPresentationName: (state, action: PayloadAction<string>) => {
      state.presentationName = action.payload;
    },

    loadPresentation: (state, action: PayloadAction<{ slides: Slide[]; name: string }>) => {
      state.slides = action.payload.slides;
      state.presentationName = action.payload.name;
      state.currentSlideId = action.payload.slides.length > 0 ? action.payload.slides[0].id : null;
      state.currentSlideIndex = action.payload.slides.length > 0 ? 0 : -1;
      state.lastSaved = Date.now();
      state.isDirty = false;
      state.error = null;
    },

    clearPresentation: (state) => {
      state.slides = [];
      state.currentSlideId = null;
      state.presentationName = 'Untitled Presentation';
      state.lastSaved = null;
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    markAsSaved: (state) => {
      state.lastSaved = Date.now();
      state.isDirty = false;
    },
  },
});

export const {
  addSlide,
  deleteSlide,
  setCurrentSlide,
  updateSlide,
  duplicateSlide,
  reorderSlides,
  setSelectedTool,
  setPresentationName,
  loadPresentation,
  clearPresentation,
  setLoading,
  setError,
  markAsSaved,
} = presentationSlice.actions;

export default presentationSlice.reducer;
