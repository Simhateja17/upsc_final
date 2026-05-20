import { redirect } from 'next/navigation';

export default function BookmarksPage() {
  redirect('/dashboard/saved-notes');
}
