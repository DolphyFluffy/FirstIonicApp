import { Injectable } from '@angular/core';
import { Camera, CameraPhoto, CameraResultType, CameraSource} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  constructor() { }

  // Array of photos which containsa  reference to each photo
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos"; // Constant variable that is the key for the store

  // Add a new class method
  public async addNewToGallery() {
  // Take a photo
  // This opens the device camera
  const capturedPhoto = await Camera.getPhoto({ // Same for all platforms
    resultType: CameraResultType.Uri, // file-based data; provides best performance
    source: CameraSource.Camera, // automatically take a new photo with the camera
    quality: 100 // highest quality (0 to 100)
  });

  // Save the picture and add it to photo collection
  const savedImageFile = await this.savePicture(capturedPhoto);
  this.photos.unshift(savedImageFile);

  // Phots array is stored each time a new phto is taken (all phtoto data is saved)
  Storage.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.photos)
  })
  }

  // Saves photo to file system
  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }

  // Helper function - requires a bit more platform logic
  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
  
    return await this.convertBlobToBase64(blob) as string;
  }
  
  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob); // Converts blob to base 64
  });

  // Allows you to retrive the photos array in JSON formate then parse to array
  public async loadSaved() {
    // Retrieve cached photo array data
    const photolist = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photolist.value) || [];

    // Display the photo by reading into base64 format
    for (let photo of this.photos) {
      // Read each saved photo's data from the Filesystem
      const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
      });

      // Web platform only: Load the photo as base64 data
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
}
  }
}

// Holds the photo metadata
export interface Photo {
  filepath: string;
  webviewPath: string;
}