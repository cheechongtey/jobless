import { ApplicationPage } from '@/pages-layer/application';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApplicationPage id={id} />;
}
