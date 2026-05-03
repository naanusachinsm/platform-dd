import { cn } from "@/lib/utils";
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
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { authService } from "@/api/authService";
import { useAppStore } from "@/stores/appStore";
import { getDefaultRoute } from "@/components/auth";
import { z } from "zod";
import { toast } from "sonner";

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;

export function GetStartedForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSubmittingRef = useRef(false);

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSigninChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSigninData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrors({});

    try {
      const validated = signupSchema.parse(signupData);
      const response = await authService.signup({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        password: validated.password,
      });

      if (response.success && response.data) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
          organizationId: userData.organizationId,
          organization: userData.organization,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        });
        toast.success("Account created successfully!");
        navigate(getDefaultRoute(userData.role));
      } else {
        toast.error(response.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[0];
          if (field) fieldErrors[field.toString()] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrors({});

    try {
      const validated = signinSchema.parse(signinData);
      const response = await authService.userLogin(validated);

      if (response.success && response.data) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatarUrl: userData.avatarUrl,
          role: userData.role,
          organizationId: userData.organizationId,
          organization: userData.organization,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        });
        toast.success("Welcome back!");
        navigate(getDefaultRoute(userData.role));
      } else {
        toast.error(response.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const field = err.path[0];
          if (field) fieldErrors[field.toString()] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  // const handleGoogleLogin = () => {
  //   authService.initiateGoogleLogin();
  // };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 w-full max-w-sm sm:max-w-md",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 mb-2 sm:mb-4">
        <h1 className="text-2xl font-semibold tracking-wider text-foreground font-brand">
          Byteful
        </h1>
      </div>

      <Card className="w-full bg-card border-border">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer mb-4"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div> */}

          {mode === "signin" ? (
            <form onSubmit={handleSignin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={signinData.email}
                    onChange={handleSigninChange}
                    required
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signinData.password}
                      onChange={handleSigninChange}
                      required
                      className={cn("pr-10", errors.password ? "border-red-500" : "")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={signupData.firstName}
                      onChange={handleSignupChange}
                      required
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={signupData.lastName}
                      onChange={handleSignupChange}
                      required
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      required
                      className={cn("pr-10", errors.password ? "border-red-500" : "")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
                <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setErrors({}); }}
                  className="text-primary hover:underline underline-offset-4 font-medium cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setErrors({}); }}
                  className="text-primary hover:underline underline-offset-4 font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance">
        By continuing, you agree to our{" "}
        <a
          href="/terms-and-conditions"
          onClick={(e) => { e.preventDefault(); navigate("/terms-and-conditions"); }}
          className="underline underline-offset-4 hover:text-primary font-semibold"
        >
          Terms and Conditions
        </a>{" "}
        and{" "}
        <a
          href="/privacy-policy"
          onClick={(e) => { e.preventDefault(); navigate("/privacy-policy"); }}
          className="underline underline-offset-4 hover:text-primary font-semibold"
        >
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
