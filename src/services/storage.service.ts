// src/services/storage.service.ts
// Handles all file system operations: downloads, SHA256 verification, path resolution.
// This service is the ONLY place that uses react-native-fs directly.

import RNFS from 'react-native-fs';
import { DownloadProgressCallback } from '../ai/types';

const MODELS_DIR = `${RNFS.DocumentDirectoryPath}/models`;
const ATTACHMENTS_DIR = `${RNFS.DocumentDirectoryPath}/attachments`;

class StorageService {
  /**
   * Ensures the models and attachments directories exist.
   * Call once at startup.
   */
  async ensureDirectories(): Promise<void> {
    await RNFS.mkdir(MODELS_DIR);
    await RNFS.mkdir(ATTACHMENTS_DIR);
  }

  /**
   * Returns the absolute path where a model file should be stored.
   */
  getModelPath(filename: string): string {
    return `${MODELS_DIR}/${filename}`;
  }

  /**
   * Returns the absolute path for an attachment file.
   */
  getAttachmentPath(messageId: string, filename: string): string {
    return `${ATTACHMENTS_DIR}/${messageId}/${filename}`;
  }

  /**
   * Downloads a file from the given URL to the destination path.
   * Reports download progress as 0–100.
   */
  async downloadFile(
    url: string,
    destPath: string,
    onProgress: DownloadProgressCallback,
  ): Promise<void> {
    // Ensure directory exists
    const dir = destPath.substring(0, destPath.lastIndexOf('/'));
    await RNFS.mkdir(dir);

    const downloadResult = RNFS.downloadFile({
      fromUrl: url,
      toFile: destPath,
      background: false,
      discretionary: false,
      progress: res => {
        if (res.contentLength > 0) {
          const pct = Math.round((res.bytesWritten / res.contentLength) * 100);
          onProgress(Math.min(pct, 100));
        }
      },
    });

    const result = await downloadResult.promise;

    if (result.statusCode !== 200) {
      // Cleanup partial download
      await this.deleteFile(destPath);
      throw new Error(
        `[Storage] Download failed with status ${result.statusCode}: ${url}`,
      );
    }
  }

  /**
   * Verifies the SHA256 hash of a local file against an expected value.
   * Returns true if they match; false otherwise.
   */
  async verifySHA256(filePath: string, expected: string): Promise<boolean> {
    try {
      const hash = await RNFS.hash(filePath, 'sha256');
      return hash.toLowerCase() === expected.toLowerCase();
    } catch (error) {
      console.warn('[Storage] SHA256 verification error:', error);
      return false;
    }
  }

  /**
   * Deletes a file at the given path. Silently ignores "file not found" errors.
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.warn('[Storage] Failed to delete file:', filePath, error);
    }
  }

  /**
   * Checks if a file exists at the given path.
   */
  async fileExists(filePath: string): Promise<boolean> {
    return RNFS.exists(filePath);
  }

  /**
   * Returns the size of a file in bytes, or 0 if not found.
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await RNFS.stat(filePath);
      return stat.size;
    } catch {
      return 0;
    }
  }
}

export const storageService = new StorageService();
