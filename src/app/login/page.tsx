import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to see your burnout profile."
      footer={
        <div className="space-y-2">
          <p>
            New to PulseWork?{" "}
            <Link href="/signup" className="font-medium text-teal hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            Are you an employer?{" "}
            <Link href="/admin/login" className="font-medium text-teal hover:underline">
              Employer login
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm variant="employee" />
    </AuthCard>
  );
}
