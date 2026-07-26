"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToAnalysis() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const childId = params.get("childId");
    router.replace(childId ? `/analysis?childId=${childId}` : "/children");
  }, [params, router]);
  return <main className="flow-page" />;
}
export default function RecommendationPage() {
  return <Suspense><RedirectToAnalysis /></Suspense>;
}
