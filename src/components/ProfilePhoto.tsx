import Image from "next/image";
import { profilePhotoSrc } from "@/lib/content";

export default function ProfilePhoto({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[6/5] w-56 shrink-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm sm:w-64 ${className}`}
    >
      {profilePhotoSrc && (
        <Image
          src={profilePhotoSrc}
          alt="Foto de Thiago"
          fill
          sizes="(min-width: 640px) 256px, 224px"
          quality={90}
          className="object-cover"
          priority
        />
      )}
    </div>
  );
}
