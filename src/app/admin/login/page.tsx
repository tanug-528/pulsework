import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Employer login" };

export default async function AdminLoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthCard
      title="Employer login"
      subtitle="View anonymous, team-level burnout trends."
      footer={
        <Link href="/login" className="font-medium text-teal hover:underline">
          ← Employee login
        </Link>
      }
    >
      <LoginForm variant="admin" />
    </AuthCard>
  );
}
