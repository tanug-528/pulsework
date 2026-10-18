"use client";

import { useActionState } from "react";
import { adminLogin, employeeLogin, type FormState } from "@/app/actions/auth";
import { FormError, SubmitButton, TextField } from "./FormFields";

export function LoginForm({ variant }: { variant: "employee" | "admin" }) {
  const action = variant === "admin" ? adminLogin : employeeLogin;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} link={state.switchTo} />
      <TextField label="Email" name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" />
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  );
}
