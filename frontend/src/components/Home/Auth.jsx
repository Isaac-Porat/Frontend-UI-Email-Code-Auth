import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const formSchema = z.object({
  username: z.string().min(4, {
    message: "Username must be at least 4 characters.",
  }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),
});

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState({ type: null, message: null });
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleAuthentication = async (formData, isLogin) => {
    setIsLoading(true);
    setResponse({ type: null, message: null });

    try {
      let success;
      if (isLogin) {
        success = await login(formData);
      } else {
        success = await signup(formData);
      }

      if (success) {
        setResponse({ type: 'success', message: `${isLogin ? 'Login' : 'Registration'} successful!` });
        navigate('/');
      } else {
        throw new Error(`${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (error) {
      setResponse({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      console.error(`${isLogin ? 'Login' : 'Registration'} error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data) => {
    handleAuthentication(data, activeTab === 'login');
  };

  const AuthForm = ({ action }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
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
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {response.type && (
          <FormMessage className={response.type === 'error' ? 'text-red-500' : 'text-green-500'}>
            {response.message}
          </FormMessage>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Processing...' : (action === 'login' ? 'Log In' : 'Sign Up')}
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Login or create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AuthForm action="login" />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm action="signup" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;