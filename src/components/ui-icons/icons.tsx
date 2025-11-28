import {
    Folder,
    FileIcon as FilePdf,
    FileImage,
    FileText,
    FileCode,
    FileAudio,
    FileVideo,
    File
} from "lucide-react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// This is to have consistent icon colors across the app

const iconVariants = cva(
  "",
  {
    variants: {
      size: {
        default: "h-5 w-5",
        lg: "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export function FolderIcon({ size }: VariantProps<typeof iconVariants>) {
    return <Folder className={cn(iconVariants({ size }), "text-blue-500")} />;
}

export function PDFIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FilePdf className={cn(iconVariants({ size }), "text-red-500")} />;
}

export function ImageIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FileImage className={cn(iconVariants({ size }), "text-green-500")} />;
}

export function TextIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FileText className={cn(iconVariants({ size }), "text-yellow-500")} />;
}

export function CodeIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FileCode className={cn(iconVariants({ size }), "text-purple-500")} />;
}

export function AudioIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FileAudio className={cn(iconVariants({ size }), "text-orange-500")} />;
}

export function VideoIcon({ size }: VariantProps<typeof iconVariants>) {
    return <FileVideo className={cn(iconVariants({ size }), "text-pink-500")} />;
}

export function GenericFileIcon({ size }: VariantProps<typeof iconVariants>) {
    return <File className={cn(iconVariants({ size }), "text-gray-500")} />;
}