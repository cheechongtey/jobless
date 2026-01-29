import { ApplicationContent } from '@/pages-layer/application/ui/application-content';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationContent id={id} />;
}
