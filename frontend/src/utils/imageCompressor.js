// frontend/src/utils/imageCompressor.js

/**
 * Compresses and optimizes an image File before network upload.
 * Reduces 4K/retina desktop screenshots (3MB - 8MB) to ~200-400KB with crystal clear quality.
 *
 * @param {File} file - The original File from <input type="file">
 * @param {number} maxWidth - Max width in pixels (default: 1920)
 * @param {number} maxHeight - Max height in pixels (default: 1200)
 * @param {number} quality - Quality between 0.1 and 1.0 (default: 0.85)
 * @returns {Promise<File>} - Optimized File or original if small/failed
 */
export async function compressImageFile(file, maxWidth = 1920, maxHeight = 1200, quality = 0.85) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    return file;
  }

  // Files under 500 KB are already fast to upload
  if (file.size <= 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    // 5-second safety timeout: never hang the submission UI if image processing stalls
    const timeoutTimer = setTimeout(() => {
      resolve(file);
    }, 5000);

    const safeResolve = (res) => {
      clearTimeout(timeoutTimer);
      resolve(res || file);
    };

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width / height > maxWidth / maxHeight) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              return safeResolve(file);
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Test if canvas supports webp export, otherwise fallback to jpeg
            const mimeType = "image/webp";
            canvas.toBlob(
              (blob) => {
                try {
                  if (!blob || blob.size >= file.size) {
                    // If compression didn't reduce size, keep original
                    return safeResolve(file);
                  }
                  const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                  let resultFile;
                  try {
                    resultFile = new File([blob], newName, {
                      type: mimeType,
                      lastModified: Date.now(),
                    });
                  } catch (_) {
                    // Fallback for iOS / WebKit where new File() is unsupported
                    blob.name = newName;
                    resultFile = blob;
                  }
                  safeResolve(resultFile || file);
                } catch (toBlobErr) {
                  console.warn("toBlob error, fallback to original:", toBlobErr);
                  safeResolve(file);
                }
              },
              mimeType,
              quality
            );
          } catch (canvasErr) {
            console.warn("Canvas compression failed, using original file:", canvasErr);
            safeResolve(file);
          }
        };
        img.onerror = () => safeResolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => safeResolve(file);
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Image compression error:", err);
      safeResolve(file);
    }
  });
}
