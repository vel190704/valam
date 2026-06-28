import { Suspense } from "react";
import LearningLevel from "./LearningLevel";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LearningLevel />
    </Suspense>
  );
}