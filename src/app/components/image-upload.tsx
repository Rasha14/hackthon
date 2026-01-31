import { motion } from "motion/react";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { GlassCard } from "./glass-card";

interface ImageUploadProps {
  onImageUpload: (files: File[]) => void;
  images: File[];
}

export function ImageUpload({ onImageUpload, images }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    onImageUpload([...images, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onImageUpload([...images, ...files]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImageUpload(newImages);
  };

  return (
    <div>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[16px] p-12 text-center cursor-pointer
          transition-all duration-300 ${
            isDragging 
              ? 'border-[#06b6d4] bg-[#06b6d4]/10' 
              : 'border-white/20 hover:border-[#06b6d4]/50 bg-white/30 dark:bg-white/5'
          }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.div
          animate={{ y: isDragging ? -10 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-[#06b6d4]" />
          <h3 className="font-semibold mb-2">Drag & drop images here</h3>
          <p className="text-muted-foreground text-sm">or click to browse</p>
        </motion.div>
      </motion.div>

      {images.length > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {images.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="relative overflow-hidden group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-40 object-cover"
                />
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-destructive/80 backdrop-blur-sm 
                    rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
                    transition-opacity"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
