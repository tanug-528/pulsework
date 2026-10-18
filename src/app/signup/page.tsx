import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthCard
      title="Create your account"
      subtitle="Your individual results are private to you. Your employer only sees anonymous team averages."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
