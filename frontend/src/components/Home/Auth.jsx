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
import VerifyEmail from '../Auth/VerifyEmail';
import ForgotPassword from '../Auth/ForgotPassword';

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(true);
  const { login, register, verificationEmail } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    if (isRegistering) {
      try { // register route
        const { statusCode, statusMessage } = await register(data);
        if (statusCode === 201) {
          form.reset();
        } else {
          form.setError('root', {
            type: 'manual',
            message: statusMessage || "Registration failed. Please try again."
          });
        }
      } catch (error) {
        form.setError('root', {
          type: 'manual',
          message: error.message || "An error occurred during registration."
        });
      }
    } else {
      try { // login route
        const { success, statusCode } = await login(data);
        if (success) {
          navigate('/');
        } else {
          if (statusCode === 401) {
            form.setError('root', {
              type: 'manual',
              message: "Invalid email or password."
            });
          } else {
            form.setError('root', {
              type: 'manual',
              message: `Login failed with status code ${statusCode}. Please try again.`
            });
          }
        }
      } catch (error) {
        form.setError('root', {
          type: 'manual',
          message: error.message || "An error occurred during login."
        });
      }
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{verificationEmail ? "Verify Email" : (isRegistering ? "Register" : "Login")}</CardTitle>
            <CardDescription>
              {verificationEmail ? "Enter the verification code sent to your email" : (isRegistering ? "Create a new account" : "Login to your account")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationEmail ? (
              <VerifyEmail />
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter your email" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormMessage>{form.formState.errors.root?.message}</FormMessage>
                  <Button type="submit" className="w-full">
                    {isRegistering ? "Register" : "Login"}
                  </Button>
                </form>
              </Form>
            )}
            {!isRegistering && (
              <p className='mt-2 text-left text-sm'>
                Forgot your password?{' '}
                <button
                  className='text-blue-500 underline hover:text-blue-700'
                  onClick={() => setShowForgotPassword(true)}
                >
                  Reset it here
                </button>
              </p>
            )}
            {!verificationEmail && (
              <p className="mt-4 text-center">
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    form.clearErrors();
                    form.reset();
                  }}
                >
                  {isRegistering ? "Login" : "Register"}
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;