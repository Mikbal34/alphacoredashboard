"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "E-posta adresi gereklidir" })
    .email({ message: "Geçerli bir e-posta adresi giriniz" }),
  password: z
    .string()
    .min(1, { message: "Şifre gereklidir" })
    .min(6, { message: "Şifre en az 6 karakter olmalıdır" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function GirisPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Geçersiz e-posta veya şifre");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyiniz.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Alphacore
          </h1>
          <p className="text-slate-300 text-lg">Dashboard Yönetim Paneli</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              Giriş Yap
            </CardTitle>
            <CardDescription className="text-slate-400">
              Hesabınıza erişmek için giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">
                        E-posta
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ornek@alphacore.com"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Şifre</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50">
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-6 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>
              </form>
            </Form>

            {/* Additional Links */}
            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-slate-400 hover:text-purple-400 transition-colors duration-200"
              >
                Şifrenizi mi unuttunuz?
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          © 2024 Alphacore. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
