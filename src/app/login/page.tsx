import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <div className="lab-grid flex min-h-screen items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
