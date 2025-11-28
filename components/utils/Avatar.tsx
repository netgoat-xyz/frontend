"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import config from "../../public/config.json";

export default function Avatar() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session") || "null");
    if (!session) return;

    const avatar = `${config.backend}/avatars${session.avatar}`;
    const user = session.username;

    console.log(localStorage.getItem("session"));

    setSrc(
      avatar ||
        `https://www.tapback.co/api/avatar/${user}`
    );
  }, []);

    if (!src) return null; // don’t render until ready

  return (
    <Image
      alt="AAAAA"
      width={96}
      height={96}
      src={src}
      className="size-24 flex-none rounded-lg object-cover"
    />
  );
}
