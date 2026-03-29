const HEIC_FILE_EXTENSION_PATTERN = /\.(heic|heif)$/i;
const MAX_FULL_IMAGE_SIZE_MB = 4;
const MAX_FULL_IMAGE_EDGE = 2560;
const MAX_THUMBNAIL_IMAGE_SIZE_MB = 0.25;
const MAX_THUMBNAIL_IMAGE_EDGE = 480;
const MAX_BACKEND_UPLOAD_BYTES = 10 * 1024 * 1024;

interface CompressionPreset {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
  suffix?: string;
}

export interface PreparedLifeImageUpload {
  imageFile: File;
  thumbnailFile: File;
  width: number;
  height: number;
}

function isHeicLikeFile(file: File) {
  return file.type === "image/heic" || file.type === "image/heif" || HEIC_FILE_EXTENSION_PATTERN.test(file.name);
}

function getCompressionFileType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg") {
    return file.type;
  }

  return "image/jpeg";
}

function getFileExtensionFromType(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function buildFileName(fileName: string, contentType: string, suffix = "") {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  const extension = getFileExtensionFromType(contentType);

  return `${baseName || "life-image"}${suffix}.${extension}`;
}

async function convertHeicToJpeg(file: File) {
  let convertedBlob: Blob | Blob[];

  try {
    const { default: heic2any } = await import("heic2any");

    convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
  } catch {
    throw new Error("实况照片转换失败，请换一张照片或先导出为 JPG 后重试。");
  }

  const normalizedBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

  if (!(normalizedBlob instanceof Blob)) {
    throw new Error("实况照片转换失败，请换一张照片重试。");
  }

  return new File([normalizedBlob], buildFileName(file.name, "image/jpeg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

async function compressImage(file: File, preset: CompressionPreset) {
  try {
    const { default: imageCompression } = await import("browser-image-compression");
    const contentType = getCompressionFileType(file);
    const compressedFile = await imageCompression(file, {
      maxSizeMB: preset.maxSizeMB,
      maxWidthOrHeight: preset.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: preset.initialQuality,
      fileType: contentType,
    });

    return new File([compressedFile], buildFileName(file.name, contentType, preset.suffix), {
      type: contentType,
      lastModified: Date.now(),
    });
  } catch {
    throw new Error("图片处理失败，请换一张照片或稍后重试。");
  }
}

async function normalizeLifeImageFile(file: File) {
  if ((!file.type || !file.type.startsWith("image/")) && !isHeicLikeFile(file)) {
    throw new Error("请选择图片文件后再上传。");
  }

  return isHeicLikeFile(file) ? convertHeicToJpeg(file) : file;
}

export async function prepareLifeImageForUpload(file: File): Promise<PreparedLifeImageUpload> {
  const normalizedFile = await normalizeLifeImageFile(file);
  const [imageFile, thumbnailFile] = await Promise.all([
    compressImage(normalizedFile, {
      maxSizeMB: MAX_FULL_IMAGE_SIZE_MB,
      maxWidthOrHeight: MAX_FULL_IMAGE_EDGE,
      initialQuality: 0.88,
    }),
    compressImage(normalizedFile, {
      maxSizeMB: MAX_THUMBNAIL_IMAGE_SIZE_MB,
      maxWidthOrHeight: MAX_THUMBNAIL_IMAGE_EDGE,
      initialQuality: 0.74,
      suffix: "-thumb",
    }),
  ]);

  if (imageFile.size > MAX_BACKEND_UPLOAD_BYTES) {
    throw new Error("图片处理后仍超过 10MB，请先导出较小版本后再上传。");
  }

  const { width, height } = await readImageDimensions(imageFile);

  return {
    imageFile,
    thumbnailFile,
    width,
    height,
  };
}

export async function readImageDimensions(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const imageBitmap = await createImageBitmap(file);

      try {
        return {
          width: imageBitmap.width,
          height: imageBitmap.height,
        };
      } finally {
        imageBitmap.close();
      }
    } catch {
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        reject(new Error("图片尺寸读取失败"));
      };

      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
