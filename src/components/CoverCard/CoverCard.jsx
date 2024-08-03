import React from "react";
import Image from "next/image";
import Link from "next/link";
import Card from "./CoverCard.css"

function CoverCard(props) {
  return (
    <div className="bg-gray-50 rounded-lg flex  flex-col w-fit p-5 items-center m-3 cardArchive  text-black colorChange shadow-md shadow-[#243e38]">
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col space-y-3"
      >
        <Image src={props.src} alt={props.alt} width={220} height={293} priority={true} style={{width: "220px", height:"293px"}}></Image>
        <p className="font-semibold "> {props.title}</p>
      </a>
    </div>
  );
}

export default CoverCard;
