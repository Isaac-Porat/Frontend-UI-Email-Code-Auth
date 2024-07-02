import { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const codeSchema = z.object({
  code: z.string().min(6, { message: "Code must be at least 6 characters" }),
});

const passwordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ForgotPassword = () => {
  const [state, setState] = useState('email');
  const [userEmail, setUserEmail] = useState('');
  const { forgotPassword, verifyEmail, updatePassword } = useAuth();
  const navigate = useNavigate();

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleEmailSubmit = async (data) => {
    try {
      const { statusCode, statusMessage } = await forgotPassword(data);
      if (statusCode === 200) {
        setState('code');
        setUserEmail(data.email);
      } else {
        emailForm.setError('root', {
          type: 'manual',
          message: statusMessage || "Failed to send reset code. Please try again.",
        });
      }
    } catch (error) {
      emailForm.setError('root', {
        type: 'manual',
        message: error.message || "An error occurred. Please try again.",
      });
    }
  };

  const handleCodeSubmit = async (data) => {
    const updated_data = {
      "email": userEmail,
      "code": data.code
    }
    try {
      const userData = await verifyEmail(updated_data);
      if (userData) {
        setState('password');
      } else {
        codeForm.setError('root', {
          type: 'manual',
          message: "Invalid or expired code. Please try again.",
        });
      }
    } catch (error) {
      codeForm.setError('root', {
        type: 'manual',
        message: error.message || "An error occurred. Please try again.",
      });
    }
  };

  const handlePasswordSubmit = async (data) => {
    try {
      const { statusCode, message } = await updatePassword(data);
      if (statusCode === 200) {
        console.log("Password reset successful");
        navigate('/');
      } else {
        passwordForm.setError('root', {
          type: 'manual',
          message: message || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      passwordForm.setError('root', {
        type: 'manual',
        message: error.message || "An error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {state === 'email' && "Enter your email to reset your password"}
              {state === 'code' && "Enter the code sent to your email"}
              {state === 'password' && "Enter your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state === 'email' && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter your email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormMessage>{emailForm.formState.errors.root?.message}</FormMessage>
                  <Button type="submit" className="w-full">Send Reset Code</Button>
                </form>
              </Form>
            )}

            {state === 'code' && (
              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Code</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Enter the reset code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormMessage>{codeForm.formState.errors.root?.message}</FormMessage>
                  <Button type="submit" className="w-full">Verify Code</Button>
                </form>
              </Form>
            )}

            {state === 'password' && (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter your new password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Confirm your new password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormMessage>{passwordForm.formState.errors.root?.message}</FormMessage>
                  <Button type="submit" className="w-full">Reset Password</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;