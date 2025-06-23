import { Slide } from '../redux/presentationSlice';

export interface PresentationData {
  name: string;
  slides: Slide[];
  version: string;
  createdAt: number;
  updatedAt: number;
}

export class FileHandlers {
  private static readonly CURRENT_VERSION = '1.0.0';

  static async savePresentation(
    presentationName: string,
    slides: Slide[],
    format: 'json' | 'pptx' = 'json'
  ): Promise<void> {
    try {
      if (format === 'json') {
        await this.saveAsJSON(presentationName, slides);
      } else {
        await this.saveAsPPTX(presentationName, slides);
      }
    } catch (error) {
      console.error(`Error saving presentation as ${format}:`, error);
      throw new Error(`Failed to save presentation as ${format}`);
    }
  }

  private static async saveAsJSON(
    presentationName: string,
    slides: Slide[]
  ): Promise<void> {
    const data: PresentationData = {
      name: presentationName,
      slides,
      version: this.CURRENT_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${presentationName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
        URL.revokeObjectURL(url);
  }

  private static async saveAsPPTX(
    presentationName: string,
    slides: Slide[]
  ): Promise<void> {
    // For now, show a user-friendly message
    const message = `PPTX export is being developed! 
    
For now, you can:
1. Save as JSON (fully supported)
2. Export individual slides as images
3. Copy content to PowerPoint manually

We're working on full PPTX support - it will be available in a future update!`;

    alert(message);
    
    // Fallback to JSON export
    await this.saveAsJSON(presentationName, slides);
  }

  private static async loadPPTXFile(
    file: File, 
    resolve: (data: PresentationData) => void, 
    reject: (error: Error) => void
  ): Promise<void> {
    const message = `PPTX import is being developed!

For now, you can:
1. Export your PowerPoint slides as images
2. Use the Image tool to add them to your presentation
3. Save your PowerPoint as PDF and convert pages to images

We're working on full PPTX import - it will be available soon!`;

    reject(new Error(message));
  }

 

  static async loadPresentation(): Promise<PresentationData> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.pptx';
        
        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          try {
            if (file.name.toLowerCase().endsWith('.json')) {
              await this.loadJSONFile(file, resolve, reject);
            } else if (file.name.toLowerCase().endsWith('.pptx')) {
              await this.loadPPTXFile(file, resolve, reject);
            } else {
              reject(new Error('Unsupported file format. Please select a .json or .pptx file.'));
            }
          } catch (parseError) {
            reject(new Error('Failed to parse presentation file'));
          }
        };
        
        input.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        input.click();
      } catch (error) {
        reject(new Error('Failed to open file dialog'));
      }
    });
  }

  private static async loadJSONFile(
    file: File, 
    resolve: (data: PresentationData) => void, 
    reject: (error: Error) => void
  ): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text) as PresentationData;
    
    // Validate the data structure
    if (!this.validatePresentationData(data)) {
      reject(new Error('Invalid JSON presentation file format'));
      return;
    }
    
    resolve(data);
  }



  static validatePresentationData(data: any): data is PresentationData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.name === 'string' &&
      Array.isArray(data.slides) &&
      typeof data.version === 'string' &&
      data.slides.every((slide: any) => 
        typeof slide.id === 'string' &&
        typeof slide.name === 'string' &&
        typeof slide.canvasData === 'string' &&
        typeof slide.createdAt === 'number' &&
        typeof slide.updatedAt === 'number'
      )
    );
  }

  static generateThumbnail(canvasElement: HTMLCanvasElement): string {
    try {
      // Create a smaller canvas for thumbnail
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');
      
      if (!thumbnailCtx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Set thumbnail dimensions
      const thumbnailWidth = 150;
      const thumbnailHeight = (thumbnailWidth * canvasElement.height) / canvasElement.width;
      
      thumbnailCanvas.width = thumbnailWidth;
      thumbnailCanvas.height = thumbnailHeight;
      
      // Draw scaled-down version
      thumbnailCtx.drawImage(canvasElement, 0, 0, thumbnailWidth, thumbnailHeight);
      
      // Return as base64 data URL
      return thumbnailCanvas.toDataURL('image/png', 0.8);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return '';
    }
  }

  static async loadImageFromFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          // Check file size (limit to 5MB)
          if (file.size > 5 * 1024 * 1024) {
            reject(new Error('File size too large (max 5MB)'));
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = () => {
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(file);
        };
        
        input.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        input.click();
      } catch (error) {
        reject(new Error('Failed to open file dialog'));
      }
    });
  }

  static async loadImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create canvas to convert image to data URL
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (error) {
          reject(new Error('Failed to process image'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image from URL'));
      };
      
      img.src = url;
    });
  }

  static exportSlideAsImage(canvasElement: HTMLCanvasElement, slideName: string): void {
    try {
      const dataUrl = canvasElement.toDataURL('image/png', 1.0);
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${slideName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting slide:', error);
      throw new Error('Failed to export slide');
    }
  }
}
