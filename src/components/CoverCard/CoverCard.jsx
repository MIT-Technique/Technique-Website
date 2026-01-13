import React from "react";
import Image from "next/image";

function CoverCard({ src, alt, href, title }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-white shadow-sm">
        <Image
          src={src}
          alt={alt}
          fill={true}
          style={{ objectFit: "cover" }}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <p className="text-xs text-center mt-2 text-text-secondary group-hover:text-accent transition-colors">
        {title}
      </p>
    </a>
  );
}

export default CoverCard;
