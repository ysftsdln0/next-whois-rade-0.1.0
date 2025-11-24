import { toJpeg, toPng, toSvg } from "html-to-image";
import { toast } from "sonner";
import React from "react";

export enum CaptureTypes {
  PNG = "png",
  JPEG = "jpg",
  SVG = "svg",
}

export type CaptureType =
  | CaptureTypes.PNG
  | CaptureTypes.JPEG
  | CaptureTypes.SVG;
export const defaultCaptureType: CaptureType = CaptureTypes.PNG;
export const captureTypeMethods = {
  [CaptureTypes.PNG]: toPng,
  [CaptureTypes.JPEG]: toJpeg,
  [CaptureTypes.SVG]: toSvg,
};

export async function captureImage(
  filename: string,
  el?: React.RefObject<HTMLElement>,
  type?: CaptureType,
) {
  if (!el || !el.current) {
    throw new Error("Element not found");
  }

  const doCapture = captureTypeMethods[type || defaultCaptureType];
  const dataUrl = await doCapture(el.current, {
    cacheBust: true,
    filter: (node: HTMLElement) => {
      return !node.classList?.contains("no-capture");
    },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${filename}.${type || defaultCaptureType}`;
  a.click();
}

export function useImageCapture(el: React.RefObject<HTMLElement>) {
  return async (filename: string, type?: CaptureType) => {
    const promise = captureImage(filename, el, type);
    toast.promise(promise, {
      loading: "Capturing...",
      success: "Saved!",
      error: (err) => `Failed to save: ${err.message}`,
    });
  };
}
