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

  // Upload states for animations
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasCanvasObjects, setHasCanvasObjects] = useState(false);
  
  const currentSlideId = useSelector((state: RootState) => state.presentation.currentSlideId);
  const slides = useSelector((state: RootState) => state.presentation.slides);
  const selectedTool = useSelector((state: RootState) => state.presentation.selectedTool);

  const currentSlide = slides.find(slide => slide.id === currentSlideId);

  // Keyboard event handler for delete key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!fabricCanvasRef.current) return;
      
      const activeObject = fabricCanvasRef.current.getActiveObject();
      const activeObjects = fabricCanvasRef.current.getActiveObjects();
      
      if (activeObjects.length > 0) {
        activeObjects.forEach(obj => {
          fabricCanvasRef.current?.remove(obj);
        });
        fabricCanvasRef.current.discardActiveObject();
        fabricCanvasRef.current.renderAll();
        setHasCanvasObjects((fabricCanvasRef.current?.getObjects().length ?? 0) > 0);
        
        // Save canvas state after deletion
        setTimeout(() => {
          if (fabricCanvasRef.current && currentSlideId) {
            const canvasData = JSON.stringify(fabricCanvasRef.current.toJSON());
            dispatch(updateSlide({ 
              id: currentSlideId, 
              canvasData,
              thumbnail: FileHandlers.generateThumbnail(canvasRef.current!)
            }));
          }
        }, 100);
      }
    }
  }, [currentSlideId, dispatch]);

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Drag and drop handlers
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (!fabricCanvasRef.current) return;

    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please drop image files only');
      return;
    }

    // Process each image file
    for (const file of imageFiles) {
      await processImageFile(file, event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    }
  }, []);

  const processImageFile = async (file: File, x?: number, y?: number) => {
    if (!fabricCanvasRef.current) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large (max 5MB)');
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 100);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read image file'));
        };
        reader.readAsDataURL(file);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const img = await fabric.FabricImage.fromURL(dataUrl);
      
      // Scale image to fit canvas if too large
      const maxWidth = 400;
      const maxHeight = 300;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        img.scale(scale);
      }

      // Position image at drop location or default position
      const left = x !== undefined ? Math.max(10, Math.min(x - (img.width * img.scaleX) / 2, fabricCanvasRef.current.width! - (img.width * img.scaleX) - 10)) : 100;
      const top = y !== undefined ? Math.max(10, Math.min(y - (img.height * img.scaleY) / 2, fabricCanvasRef.current.height! - (img.height * img.scaleY) - 10)) : 100;

      img.set({
        left,
        top,
        borderColor: '#2563eb',
        borderScaleFactor: 2,
        cornerColor: '#2563eb',
        cornerSize: 8,
        transparentCorners: false,
        borderOpacityWhenMoving: 0.8,
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
      fabricCanvasRef.current.renderAll();

      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploadingImage(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error processing image file:', error);
      alert('Failed to load image file');
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

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
      canvas.on('object:added', () => {
        debouncedSaveCanvasState();
        setHasCanvasObjects(canvas.getObjects().length > 0);
      });
      canvas.on('object:removed', () => {
        debouncedSaveCanvasState();
        setHasCanvasObjects(canvas.getObjects().length > 0);
      });

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
          setHasCanvasObjects((fabricCanvasRef.current?.getObjects().length ?? 0) > 0);
        });
      } catch (error) {
        console.error('Error loading slide data:', error);
        // If loading fails, clear the canvas
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.renderAll();
        setHasCanvasObjects(false);
      }
    } else if (fabricCanvasRef.current) {
      // Clear canvas if no slide data
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.renderAll();
      setHasCanvasObjects(false);
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

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      const dataUrl = await FileHandlers.loadImageFromUrl(url);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
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
        borderColor: '#2563eb',
        borderScaleFactor: 2,
        cornerColor: '#2563eb',
        cornerSize: 8,
        transparentCorners: false,
        borderOpacityWhenMoving: 0.8,
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);

      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploadingImage(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error adding image from URL:', error);
      alert('Failed to load image from URL');
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const addImageFromFile = async () => {
    if (!fabricCanvasRef.current) return;

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 100);

      const dataUrl = await FileHandlers.loadImageFromFile();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
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
        borderColor: '#2563eb',
        borderScaleFactor: 2,
        cornerColor: '#2563eb',
        cornerSize: 8,
        transparentCorners: false,
        borderOpacityWhenMoving: 0.8,
      });

      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);

      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploadingImage(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error adding image from file:', error);
      alert('Failed to load image from file');
      setIsUploadingImage(false);
      setUploadProgress(0);
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
      <div key="tool-status" className="flex-shrink-0">
        {selectedTool !== 'select' && (
          <div className="p-4 flex items-center justify-center">
            <div className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click on canvas to add {selectedTool}
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress Indicator */}
      <div key="upload-progress" className="flex-shrink-0">
        {isUploadingImage && (
          <div className="p-4 flex items-center justify-center">
            <div className="bg-white border border-gray-300 text-gray-800 px-6 py-3 rounded-lg text-sm font-medium shadow-sm flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading image... {uploadProgress}%</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Canvas Container */}
      <div key="canvas-container" className="flex-1 flex items-center justify-center p-2 lg:p-4 min-h-0 relative">
        {/* Drag and Drop Overlay */}
        <div key="drag-overlay" className={`absolute inset-0 z-10 transition-opacity duration-200 ${isDragOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-gray-100 bg-opacity-90 border-4 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
            <div className="bg-white border border-gray-300 text-gray-800 px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-lg font-semibold">Drop images here to add them to your slide</span>
            </div>
          </div>
        </div>

        <div 
          key="canvas-wrapper"
          className="bg-white shadow-lg rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 transition-all duration-300 hover:shadow-xl relative" 
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag and Drop Instructions */}
          <div key="drop-instructions" className={`absolute inset-0 flex items-center justify-center pointer-events-none z-5 transition-opacity duration-200 ${!isDragOver && !hasCanvasObjects ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center text-gray-400 bg-white bg-opacity-90 px-4 lg:px-6 py-3 lg:py-4 rounded-lg border border-dashed border-gray-300">
              <svg className="w-8 lg:w-12 h-8 lg:h-12 mx-auto mb-2 lg:mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs lg:text-sm font-medium">Drag & drop images here</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">or use the toolbar to add content</p>
            </div>
          </div>

          <canvas
            key="fabric-canvas"
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

      {/* Help Text */}
      <div key="help-text" className="flex-shrink-0 p-2 text-center hidden sm:block">
        <p className="text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Del</kbd> to delete selected objects • 
          <span className="hidden md:inline">Drag & drop images onto the canvas • </span>
          Click tools then click canvas to add elements
        </p>
      </div>
    </div>
  );
});

SlideCanvas.displayName = 'SlideCanvas';
