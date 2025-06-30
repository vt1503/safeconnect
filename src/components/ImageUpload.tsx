import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Image, X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

// Hàm để làm sạch tên file
const sanitizeFileName = (filename: string): string => {
  // Normalize để tách dấu và ký tự
  let name = filename.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Chuyển thành chữ thường
  name = name.toLowerCase();
  // Thay thế khoảng trắng và các ký tự không mong muốn bằng dấu gạch dưới
  name = name.replace(/\s+/g, "_"); // Thay khoảng trắng
  name = name.replace(/[^a-z0-9_.-]/g, ""); // Loại bỏ các ký tự không phải chữ, số, '_', '.', '-'
  // Đảm bảo không có nhiều dấu chấm liên tiếp
  name = name.replace(/\.{2,}/g, ".");
  // Đảm bảo không có nhiều dấu gạch dưới liên tiếp
  name = name.replace(/_{2,}/g, "_");
  // Loại bỏ dấu gạch dưới hoặc dấu chấm ở đầu hoặc cuối tên file
  name = name.replace(/^[_.-]+|[_.-]+$/g, "");
  return name;
};

interface ImageUploadProps {
  initialImageUrls?: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 4,
  initialImageUrls,
}) => {
  const [uploading, setUploading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (initialImageUrls) {
      setImageUrls(initialImageUrls);
    }
  }, [initialImageUrls]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls || []);
  const [progress, setProgress] = useState<number>(0);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > maxImages) {
      toast.error(
        t("imageUpload.maxImagesError").replace(
          "{{maxImages}}",
          maxImages.toString()
        )
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    const newUrls: string[] = [];
    let fakeProgressInterval: NodeJS.Timeout | null = null;

    try {
      if (files.length === 1) {
        // Giả lập progress cho 1 file
        let fake = 0;
        fakeProgressInterval = setInterval(() => {
          fake += Math.random() * 10 + 5; // tăng ngẫu nhiên 5-15%
          if (fake >= 90) fake = 90;
          setProgress(Math.round(fake));
        }, 120);
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}_${sanitizedFileName}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        newUrls.push(data.publicUrl);
        if (files.length > 1) {
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
      }

      const updatedUrls = [...imageUrls, ...newUrls];
      setImageUrls(updatedUrls);
      onImagesChange(updatedUrls);
      toast.success(t("imageUpload.uploadSuccess"));
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(t("imageUpload.uploadError"));
    } finally {
      if (fakeProgressInterval) {
        clearInterval(fakeProgressInterval);
      }
      setProgress(100);
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const removeImage = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    onImagesChange(updatedUrls);
  };

  return (
    <div className="space-y-3">
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          disabled={uploading || imageUrls.length >= maxImages}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || imageUrls.length >= maxImages}
            className="cursor-pointer"
            asChild
          >
            <span>
              <Image className="w-4 h-4 mr-2" />
              {uploading
                ? t("imageUpload.uploadingButton")
                : t("imageUpload.addButton")}
            </span>
          </Button>
        </label>
        <span className="text-sm text-gray-500">
          {imageUrls.length}/{maxImages}
        </span>
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={t("imageUpload.altText").replace(
                  "{{index}}",
                  (index + 1).toString()
                )}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
