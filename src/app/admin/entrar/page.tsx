import { PasswordGateForm } from "@/components/PasswordGateForm";

export default function EntrarAdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <PasswordGateForm papel="admin" />
    </main>
  );
}
