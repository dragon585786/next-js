'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
// This is temporary until @types/react-dom is updated
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
      name?: string[];
      email?: string[];
    };
    message?: string | null;
  };
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
      .number()
      .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });

  const FormSchemaCustomer = z.object({
    name: z.string({
      invalid_type_error: 'Please enter a customer name.',
    }),
    email: z.string({
      invalid_type_error: 'Please enter email address.',
    }),
    id: z.string(),
    image_url: z.string(),
  });
  const CreateCustomer = FormSchemaCustomer.omit({ id: true,image_url:true });
  const CreateInvoice = FormSchema.omit({ id: true, date: true });
  const UpdateInvoice = FormSchema.omit({ id: true, date: true });
  export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }
   
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
   
    // Insert data into the database
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }
   
    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
  export async function createCustomer(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateCustomer.safeParse({
      name: formData.get('customer_name'),
      email: formData.get('customer_email'),
    });
   console.log("validatedFields",validatedFields)
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create customer.',
      };
    }
   
    // Prepare data for insertion into the database
    const { name, email } = validatedFields.data;
    console.log("name",name,"email",email)
    // Insert data into the database
    try {
      await sql`
        INSERT INTO customers (name, email)
        VALUES (${name}, ${email})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
    console.log("error===>",error)

      return {
        message: 'Database Error: Failed to Create Customer.',
      };
    }
   
    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
  }
  export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
  ) {
    const validatedFields = UpdateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
      };
    }
   
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
   
    try {
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
      return { message: 'Database Error: Failed to Update Invoice.' };
    }
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    // throw new Error('Failed to Delete Invoice');
    try {
        await sql`
        DELETE FROM invoices
        WHERE id = ${id}
      `;
      revalidatePath('/dashboard/invoices');
      return { message: 'Deleted Invoice.' };
    } catch (error) {
        return {
            message: 'Database Error: Failed to Delete Invoice.',
          };
    }
  }

  export async function deleteCustomer(id: string) {
    // throw new Error('Failed to Delete Invoice');
    try {
        await sql`
        DELETE FROM customers
        WHERE id = ${id}
      `;
      revalidatePath('/dashboard/customers');
      return { message: 'Deleted Customer.' };
    } catch (error) {
        return {
            message: 'Database Error: Failed to Delete Customer.',
          };
    }
  }

  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }