declare module '@google-cloud/vision' {
  export class ImageAnnotatorClient {
    constructor(options?: any);
    textDetection(request: { image: { content: string } }): Promise<[{ textAnnotations: any[] }]>;
    labelDetection(request: { image: { content: string } }): Promise<[{ labelAnnotations: any[] }]>;
  }
} 