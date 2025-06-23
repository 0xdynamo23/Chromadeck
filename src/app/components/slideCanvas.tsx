'use client';

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as fabric from 'fabric';
import { RootState } from '../redux/store';
import { updateSlide, setSelectedTool } from '../redux/presentationSlice';
import { FileHandlers } from '../utils/fileHandlers';

interface SlideCanvasProps {
  className?: string;
}

export interface SlideCanvasRef {
  addImageFromUrl: (url: string) => Promise<void>;
  addImageFromFile: () => Promise<void>;
  updateSelectedTextFormat: (format: { fontSize?: number; fontWeight?: string; fontStyle?: string; textAlign?: string; fill?: string }) => void;
  updateSelectedShapeFormat: (format: { fill?: string; stroke?: string; strokeWidth?: number }) => void;
  canvas: fabric.Canvas | null;
}

export const SlideCanvas = forwardRef<SlideCanvasRef, SlideCanvasProps>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const dispatch = useDispatch();
  
  // Shape formatting state
  const [currentShapeFormat, setCurrentShapeFormat] = useState({
    fill: '#000000',
    stroke: '#2563eb',
    strokeWidth: 3
  });
  
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const selectedTool = useSelector((state: RootState) => state.presentation.selectedTool);

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  const addTextBox = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Ensure text box stays within canvas bounds
    const canvas = fabricCanvasRef.current;
    const textWidth = 200;
    const textHeight = 30;
    const adjustedX = Math.max(10, Math.min(x - textWidth/2, canvas.width! - textWidth - 10));
    const adjustedY = Math.max(10, Math.min(y - textHeight/2, canvas.height! - textHeight - 10));

    const textbox = new fabric.Textbox('Click to edit text', {
      left: adjustedX,
      top: adjustedY,
      width: textWidth,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      fontWeight: 'bold',
      textAlign: 'left',
      selectable: true,
      evented: true,
      editable: true,
      visible: true,
      opacity: 1,
      borderColor: '#2563eb',
      borderScaleFactor: 2,
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderOpacityWhenMoving: 0.8,
    });

    fabricCanvasRef.current.add(textbox);
    fabricCanvasRef.current.setActiveObject(textbox);
    
    // Enter editing mode after a small delay to ensure the object is rendered
    setTimeout(() => {
      if (textbox && fabricCanvasRef.current) {
        textbox.enterEditing();
        textbox.selectAll();
        fabricCanvasRef.current.renderAll();
      }
    }, 50);
    
    // Auto-switch back to select after creating text
    setTimeout(() => dispatch(setSelectedTool('select')), 100);
  }, [dispatch]);

  const addRectangle = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Ensure rectangle stays within canvas bounds
    const canvas = fabricCanvasRef.current;
    const rectWidth = 120;
    const rectHeight = 80;
    const adjustedX = Math.max(10, Math.min(x - rectWidth/2, canvas.width! - rectWidth - 10));
    const adjustedY = Math.max(10, Math.min(y - rectHeight/2, canvas.height! - rectHeight - 10));

    const rect = new fabric.Rect({
      left: adjustedX,
      top: adjustedY,
      width: rectWidth,
      height: rectHeight,
      fill: currentShapeFormat.fill,
      stroke: currentShapeFormat.stroke,
      strokeWidth: currentShapeFormat.strokeWidth,
      selectable: true,
      evented: true,
      visible: true,
      opacity: 1,
      borderColor: '#2563eb',
      borderScaleFactor: 2,
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderOpacityWhenMoving: 0.8,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
    
    // Auto-switch back to select after creating rectangle
    setTimeout(() => dispatch(setSelectedTool('select')), 100);
  }, [dispatch, currentShapeFormat]);

  const addCircle = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Ensure circle stays within canvas bounds
    const canvas = fabricCanvasRef.current;
    const radius = 40;
    const adjustedX = Math.max(radius + 10, Math.min(x - radius, canvas.width! - radius - 10));
    const adjustedY = Math.max(radius + 10, Math.min(y - radius, canvas.height! - radius - 10));

    const circle = new fabric.Circle({
      left: adjustedX,
      top: adjustedY,
      radius: radius,
      fill: currentShapeFormat.fill,
      stroke: currentShapeFormat.stroke,
      strokeWidth: currentShapeFormat.strokeWidth,
      selectable: true,
      evented: true,
      visible: true,
      opacity: 1,
      borderColor: '#2563eb',
      borderScaleFactor: 2,
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderOpacityWhenMoving: 0.8,
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
    
    // Auto-switch back to select after creating circle
    setTimeout(() => dispatch(setSelectedTool('select')), 100);
  }, [dispatch, currentShapeFormat]);

  const addLine = useCallback((x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Ensure line stays within canvas bounds
    const canvas = fabricCanvasRef.current;
    const lineLength = 100;
    const startX = Math.max(10, Math.min(x - lineLength/2, canvas.width! - lineLength - 10));
    const endX = startX + lineLength;
    const adjustedY = Math.max(10, Math.min(y, canvas.height! - 10));

    const line = new fabric.Line([startX, adjustedY, endX, adjustedY], {
      stroke: currentShapeFormat.stroke,
      strokeWidth: currentShapeFormat.strokeWidth,
      selectable: true,
      evented: true,
      strokeLineCap: 'round',
      borderColor: '#2563eb',
      borderScaleFactor: 2,
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
      borderOpacityWhenMoving: 0.8,
    });

    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.setActiveObject(line);
    fabricCanvasRef.current.renderAll();
    
    // Auto-switch back to select after creating line
    setTimeout(() => dispatch(setSelectedTool('select')), 100);
  }, [dispatch, currentShapeFormat]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        skipTargetFind: false,
        allowTouchScrolling: false,
      });

      fabricCanvasRef.current = canvas;
      
      // Set up event listeners with debouncing to prevent excessive saves
      let saveTimeout: NodeJS.Timeout;
      const debouncedSaveCanvasState = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          if (fabricCanvasRef.current && currentSlideId) {
            const canvasData = JSON.stringify(fabricCanvasRef.current.toJSON());
            dispatch(updateSlide({ 
              id: currentSlideId, 
              canvasData,
              thumbnail: FileHandlers.generateThumbnail(canvasRef.current!)
            }));
          }
        }, 500); // Debounce by 500ms
      };

      canvas.on('object:modified', debouncedSaveCanvasState);
      canvas.on('object:added', debouncedSaveCanvasState);
      canvas.on('object:removed', debouncedSaveCanvasState);

      // Handle resize
      const handleResize = () => {
        const container = canvasRef.current?.parentElement;
        if (container && canvas) {
          const containerWidth = container.clientWidth - 32; // Account for padding
          const containerHeight = container.clientHeight - 32;
          const aspectRatio = 1200 / 800;
          
          let newWidth = Math.min(containerWidth, 1200);
          let newHeight = newWidth / aspectRatio;
          
          if (newHeight > containerHeight) {
            newHeight = Math.min(containerHeight, 800);
            newWidth = newHeight * aspectRatio;
          }
          
          canvas.setDimensions({
            width: newWidth,
            height: newHeight
          });
          canvas.renderAll();
        }
      };

      // Initial resize
      setTimeout(handleResize, 100);
      
      // Add resize listener
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [currentSlideId, dispatch]);

  // Handle canvas mouse events based on selected tool
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      const handleCanvasClick = (event: any) => {
        // Don't add shapes if we're selecting
        if (selectedTool === 'select') {
          return;
        }

        // Prevent event bubbling
        if (event.e) {
          event.e.preventDefault();
          event.e.stopPropagation();
        }
        
        try {
          // Get the pointer position relative to the canvas
          const pointer = canvas.getPointer(event.e);

          // Ensure we're within canvas bounds
          if (pointer.x < 0 || pointer.y < 0 || pointer.x > canvas.width! || pointer.y > canvas.height!) {
            return;
          }

          switch (selectedTool) {
            case 'text':
              addTextBox(pointer.x, pointer.y);
              break;
            case 'rectangle':
              addRectangle(pointer.x, pointer.y);
              break;
            case 'circle':
              addCircle(pointer.x, pointer.y);
              break;
            case 'line':
              addLine(pointer.x, pointer.y);
              break;
          }
        } catch (error) {
          console.error('Error adding shape:', error);
        }
      };
      
      // Remove any existing mouse handlers
      canvas.off('mouse:down');
      canvas.off('mouse:up');
      canvas.off('mouse:move');
      
      // Add the click handler
      canvas.on('mouse:down', handleCanvasClick);

      return () => {
        canvas.off('mouse:down', handleCanvasClick);
      };
    }
  }, [selectedTool, addTextBox, addRectangle, addCircle, addLine]);

  // Update canvas settings based on selected tool
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const canvasElement = canvas.getElement();
      
      // Clear any existing cursor styles
      canvasElement.style.cursor = '';
      
      // Enable/disable selection based on tool
      canvas.selection = selectedTool === 'select';
      canvas.isDrawingMode = false;
      
      // Set selectable for all existing objects
      canvas.getObjects().forEach(obj => {
        obj.selectable = selectedTool === 'select';
        obj.evented = selectedTool === 'select';
      });
      
      // Update cursor based on tool and force it on the canvas element
      switch (selectedTool) {
        case 'select':
          canvas.defaultCursor = 'default';
          canvas.hoverCursor = 'move';
          canvas.moveCursor = 'move';
          canvasElement.style.cursor = 'default';
          break;
        case 'text':
          canvas.defaultCursor = 'text';
          canvas.hoverCursor = 'text';
          canvas.moveCursor = 'text';
          canvasElement.style.cursor = 'text';
          break;
        case 'rectangle':
        case 'circle':
        case 'line':
          canvas.defaultCursor = 'crosshair';
          canvas.hoverCursor = 'crosshair';
          canvas.moveCursor = 'crosshair';
          canvasElement.style.cursor = 'crosshair';
          break;
        default:
          canvas.defaultCursor = 'default';
          canvas.hoverCursor = 'default';
          canvas.moveCursor = 'move';
          canvasElement.style.cursor = 'default';
      }

      canvas.renderAll();

      // Add mouse enter/leave handlers to ensure cursor stays correct
      const handleMouseEnter = () => {
        switch (selectedTool) {
          case 'text':
            canvasElement.style.cursor = 'text';
            break;
          case 'rectangle':
          case 'circle':
          case 'line':
            canvasElement.style.cursor = 'crosshair';
            break;
          default:
            canvasElement.style.cursor = 'default';
        }
      };

      const handleMouseLeave = () => {
        canvasElement.style.cursor = 'default';
      };

      // Remove existing listeners
      canvasElement.removeEventListener('mouseenter', handleMouseEnter);
      canvasElement.removeEventListener('mouseleave', handleMouseLeave);
      
      // Add new listeners
      canvasElement.addEventListener('mouseenter', handleMouseEnter);
      canvasElement.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        canvasElement.removeEventListener('mouseenter', handleMouseEnter);
        canvasElement.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [selectedTool]);

  // Load slide data when current slide changes
  useEffect(() => {
    if (fabricCanvasRef.current && currentSlide && currentSlide.canvasData) {
      try {
        const canvasData = JSON.parse(currentSlide.canvasData);
        fabricCanvasRef.current.loadFromJSON(canvasData, () => {
          fabricCanvasRef.current?.renderAll();
        });
      } catch (error) {
        console.error('Error loading slide data:', error);
        // If loading fails, clear the canvas
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.renderAll();
      }
    }
  }, [currentSlideId]); // Only depend on currentSlideId to prevent infinite loops

  const saveCanvasState = useCallback(() => {
    if (fabricCanvasRef.current && currentSlideId) {
      const canvasData = JSON.stringify(fabricCanvasRef.current.toJSON());
      dispatch(updateSlide({ 
        id: currentSlideId, 
        canvasData,
        thumbnail: FileHandlers.generateThumbnail(canvasRef.current!)
      }));
    }
  }, [currentSlideId, dispatch]);

  const addImageFromUrl = async (url: string) => {
    if (!fabricCanvasRef.current) return;

    try {
      const dataUrl = await FileHandlers.loadImageFromUrl(url);
      
      const img = await fabric.FabricImage.fromURL(dataUrl);
      
      // Scale image to fit canvas if too large
      const maxWidth = 400;
      const maxHeight = 300;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        img.scale(scale);
      }

      img.set({
        left: 100,
        top: 100,
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
    } catch (error) {
      console.error('Error adding image from URL:', error);
      alert('Failed to load image from URL');
    }
  };

  const addImageFromFile = async () => {
    if (!fabricCanvasRef.current) return;

    try {
      const dataUrl = await FileHandlers.loadImageFromFile();
      
      const img = await fabric.FabricImage.fromURL(dataUrl);
      
      // Scale image to fit canvas if too large
      const maxWidth = 400;
      const maxHeight = 300;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        img.scale(scale);
      }

      img.set({
        left: 100,
        top: 100,
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
    } catch (error) {
      console.error('Error adding image from file:', error);
      alert('Failed to load image from file');
    }
  };

  const updateSelectedTextFormat = useCallback((format: { fontSize?: number; fontWeight?: string; fontStyle?: string; textAlign?: string; fill?: string }) => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'i-text' || activeObject.type === 'text')) {
      const textObject = activeObject as fabric.Textbox;
      
      // Apply formatting
      if (format.fontSize !== undefined) {
        textObject.set('fontSize', format.fontSize);
      }
      if (format.fontWeight !== undefined) {
        textObject.set('fontWeight', format.fontWeight);
      }
      if (format.fontStyle !== undefined) {
        textObject.set('fontStyle', format.fontStyle);
      }
      if (format.textAlign !== undefined) {
        textObject.set('textAlign', format.textAlign);
      }
      if (format.fill !== undefined) {
        textObject.set('fill', format.fill);
      }
      
      // Re-render the canvas
      fabricCanvasRef.current.renderAll();
      
      // Save the canvas state
      setTimeout(() => {
        saveCanvasState();
      }, 100);
    } else {
      // If no text object is selected, apply to next text object created
      console.log('No text object selected. Format will apply to next text object created.');
    }
  }, [saveCanvasState]);

  const updateSelectedShapeFormat = useCallback((format: { fill?: string; stroke?: string; strokeWidth?: number }) => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;

    // Update current shape format state
    setCurrentShapeFormat(prev => ({
      ...prev,
      ...format
    }));

    // Apply formatting to selected object
    if (activeObject.type === 'rect' || activeObject.type === 'circle') {
      if (format.fill !== undefined) {
        activeObject.set('fill', format.fill);
      }
      if (format.stroke !== undefined) {
        activeObject.set('stroke', format.stroke);
      }
      if (format.strokeWidth !== undefined) {
        activeObject.set('strokeWidth', format.strokeWidth);
      }
    } else if (activeObject.type === 'line') {
      if (format.stroke !== undefined) {
        activeObject.set('stroke', format.stroke);
      }
      if (format.strokeWidth !== undefined) {
        activeObject.set('strokeWidth', format.strokeWidth);
      }
    } else if (activeObject.type === 'group') {
      // Handle grouped objects
      (activeObject as fabric.Group).forEachObject((obj) => {
        if (obj.type === 'rect' || obj.type === 'circle') {
          if (format.fill !== undefined) {
            obj.set('fill', format.fill);
          }
          if (format.stroke !== undefined) {
            obj.set('stroke', format.stroke);
          }
          if (format.strokeWidth !== undefined) {
            obj.set('strokeWidth', format.strokeWidth);
          }
        } else if (obj.type === 'line') {
          if (format.stroke !== undefined) {
            obj.set('stroke', format.stroke);
          }
          if (format.strokeWidth !== undefined) {
            obj.set('strokeWidth', format.strokeWidth);
          }
        }
      });
    }

    fabricCanvasRef.current.renderAll();
    
    // Save canvas state
    saveCanvasState();
  }, [saveCanvasState]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    addImageFromUrl,
    addImageFromFile,
    updateSelectedTextFormat,
    updateSelectedShapeFormat,
    canvas: fabricCanvasRef.current,
  }), [addImageFromUrl, addImageFromFile, updateSelectedTextFormat, updateSelectedShapeFormat]);

  if (!currentSlide) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-xl`}>
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-xl font-medium mb-2">No slide selected</p>
          <p className="text-gray-500">Create a new slide to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 w-full h-full min-h-0 overflow-hidden`}>
      {/* Tool Status Indicator */}
      {selectedTool !== 'select' && (
        <div className="flex-shrink-0 p-4 flex items-center justify-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click on canvas to add {selectedTool}
          </div>
        </div>
      )}
      
      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 transition-all duration-300 hover:shadow-xl" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          <canvas
            ref={canvasRef}
            className="border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
            style={{ 
              display: 'block',
              cursor: selectedTool === 'select' ? 'default' : 'crosshair'
            }}
            tabIndex={0}
          />
        </div>
      </div>
    </div>
  );
});
