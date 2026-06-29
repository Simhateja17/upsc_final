import { redirect } from 'next/navigation';

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => next.append(key, item));
    } else if (value !== undefined) {
      next.set(key, value);
    }
  });

  const query = next.toString();
  redirect(`/dashboard/billing/plans${query ? `?${query}` : ''}`);
}
