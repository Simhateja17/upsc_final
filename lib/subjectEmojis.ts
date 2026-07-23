import { getSubjectIcon } from './subjectPalette';

export function getSubjectEmoji(subject?: string): string {
  return getSubjectIcon(subject);
}
