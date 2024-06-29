import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '../Auth/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useToast } from "../ui/use-toast"

const formSchema = z.object({
  username: z.string().min(4, {
    message: "Username must be at least 4 characters.",
  }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),
});

const Dashboard = () => {
  const { user, logout, updateUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocalUser(user);
      form.reset({
        username: user.username,
        password: "",
      });
    }
  }, [user, form]);

  if (!localUser) {
    return <div>Loading user data...</div>;
  }

  const onSubmit = async (data) => {
    try {
      const updatedUser = await updateUserData(data);

      if (updatedUser && updatedUser.username) {
        setLocalUser(prevUser => ({
          ...prevUser,
          username: updatedUser.username
        }));
        form.reset({
          username: updatedUser.username,
          password: "",
        });
      } else {
        console.error("Updated user data is invalid:", updatedUser);
      }

      setIsEditing(false);
      toast({
        title: "Profile updated successfully!",
        // description: "Friday, February 10, 2023 at 5:57 PM",
      })
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Failed to update profile. Please try again.",
        // description: "Friday, February 10, 2023 at 5:57 PM",
      })
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center container mx-auto p-4">
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>User Dashboard</CardTitle>
          <CardDescription>Welcome, {localUser.username}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage src="/api/placeholder/200/200" alt={localUser.username} />
            <AvatarFallback>{localUser.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Enter new password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save Changes</Button>
                <Button type="button" className="w-full" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-2">
              <p><strong>Username:</strong> {localUser.username}</p>
              <p><strong>Password:</strong> ••••••••</p>
              <Button className="w-full" onClick={() => setIsEditing(true)}>Edit Account Settings</Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" variant="destructive">Logout</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will end your current session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={logout}>Logout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Dashboard;