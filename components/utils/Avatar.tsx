"use client";

import { useEffect, useState } from "react";

export default function Avatar() {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session") || "null");
    if (!session) return;

    const avatar = `${process.env.NEXT_PUBLIC_BACKENDAPI}/avatars${session.avatar}`;
    const user = session.username;

    console.log(localStorage.getItem("session"));

    setSrc(
      avatar ||
        `https://www.tapback.co/api/avatar/${user}`
    );
  }, []);

    if (!src) return null; // don’t render until ready

  return (
    <img
      alt="AAAAA"
      width={96}
      height={96}
      src={src}
      className="size-24 flex-none rounded-lg object-cover"
    />
  );
}
