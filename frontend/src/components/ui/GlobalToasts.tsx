"use client";
import VictoryToast from "./VictoryToast";
import DefeatToast from "./DefeatToast";
import DrawToast from "./DrawToast";

export default function GlobalToasts() {
  return (
    <>
      <VictoryToast />
      <DefeatToast />
      <DrawToast />
    </>
  );
}