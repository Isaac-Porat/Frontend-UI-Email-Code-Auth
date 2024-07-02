import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const verifySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  code: z.string().min(1, { message: "Verification code is required" }),
});

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { verifyEmail, verificationEmail } = useAuth();

  const verifyForm = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  useEffect(() => {
    if (verificationEmail) {
      verifyForm.reset({
        email: verificationEmail,
      });
    }
  }, [verificationEmail, verifyForm]);

  const onVerifySubmit = async (data) => {
    console.log(data)
    const success = await verifyEmail(data);
    if (success) {
      navigate('/');
    } else {
      console.error('Verification failed');
    }
  };

  return (
    <Form {...verifyForm}>
      <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
        <FormField
          control={verifyForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" readOnly autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={verifyForm.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter your verification code"
                  autoComplete="off"
                  name="verification-code"
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Verify</Button>
      </form>
    </Form>
  );
};

export default VerifyEmail;
