"use client";

import { useActionState } from "react";
import { signup, type FormState } from "@/app/actions/auth";
import { FormError, SubmitButton, TextField } from "./FormFields";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signup, {});
  const f = state.fields ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <TextField label="Full name" name="name" autoComplete="name" defaultValue={f.name} />
      <TextField label="Work email" name="email" type="email" autoComplete="email" defaultValue={f.email} />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <TextField
        label="Company name"
        name="company"
        autoComplete="organization"
        defaultValue={f.company}
        hint="Use the exact name your employer uses, so you're counted in your team's anonymous results."
      />
      <TextField
        label="Job role"
        name="role"
        autoComplete="organization-title"
        placeholder="e.g. Software Engineer"
        defaultValue={f.role}
      />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
