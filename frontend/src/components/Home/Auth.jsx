import React, { useState, useEffect } from 'react';
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

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { login, register, verificationEmail } = useAuth();

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (verificationEmail) {
      setIsVerifying(true);
    }
  }, [verificationEmail]);

  const onRegisterSubmit = async (data) => {
    const success = await register(data);
    if (success) {
      setIsVerifying(true);
    } else {
      console.error('Registration failed');
    }
  };

  const onLoginSubmit = async (data) => {
    const success = await login(data);
    if (success) {
      navigate('/');
    } else {
      console.error('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{isVerifying ? "Verify Email" : (isRegistering ? "Register" : "Login")}</CardTitle>
            <CardDescription>
              {isVerifying ? "Enter the verification code sent to your email" : (isRegistering ? "Create a new account" : "Login to your account")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <VerifyEmail />
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(isRegistering ? onRegisterSubmit : onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
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
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {isRegistering ? "Register" : "Login"}
                  </Button>
                </form>
              </Form>
            )}
            {!isVerifying && (
              <p className="mt-4 text-center">
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => setIsRegistering(!isRegistering)}
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
